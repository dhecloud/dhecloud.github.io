---
title: "Two ways to export a LoRA to ONNX (one of them is ~13× faster)"
date: 2026-05-30
draft: true
tags: ["ONNX", "LoRA", "inference", "performance"]
summary: "The two-implementation arc from iterative deltas to LoRA-as-inputs single graph, the KV cache + IOBinding speedup, and two non-obvious lifetime/binding pitfalls."
---

I wanted to run a 0.6B Qwen + LoRA adapter on-device, which meant ONNX. The naive export gave me ~100 ms/token, which is too slow to feel interactive. After two rewrites and a hard look at how ONNX Runtime moves tensors around, I got it to ~15 ms/token. The two big levers were keeping LoRA weights as graph *inputs* instead of two separate ONNX files, and binding the KV cache to on-device buffers with IOBinding so they stop crossing the host boundary every step. Here are both, with the pitfalls I hit.

(This whole post is reproducible on any public Qwen + LoRA — feel free to swap in your own task.)

## The setup

- Base: Qwen3-0.6B. Adapter: r=16 LoRA on attention + MLP projections.
- Goal: single decode loop, no PyTorch at inference, KV cache on-device.
- Constraint: the base graph should be reusable across LoRA tasks (hot-swap the adapter, not the base).

## Implementation 1: two ONNX files

- Idea: base graph exposes 196 hidden-state outputs (one per LoRA target) and 196 delta inputs. A second LoRA graph takes hidden states, returns deltas.
- Inference loop: iterate `deltas_{k+1} = LoRA(harvest(base(x; deltas_k)))` until argmax stabilizes.
- Numerical agreement vs PyTorch: `max|Δ| ≈ 3e-4` — fine.
- Latency: 3–12 ORT calls per token, ~100 ms/token. Too slow.
- Diagnosis: per-step host-device transit, every iteration, for both base and adapter.

## Implementation 2: single graph, LoRA weights as inputs

- Base graph contains the math `y = Wx + (xA)B`, but `A` and `B` are graph inputs, not initializers.
- One ORT session. One call per token. Hot-swap is just rebinding two tensors.
- Numerical agreement: `max|Δ| ≈ 7e-4`.
- *But* — without KV cache, still ~200 ms/token, because past K/V tensors are now a feed-dict that crosses host↔device on every step.

## KV cache + IOBinding (the real win)

- IOBinding lets you tell ORT *"this input/output lives at this device buffer; don't copy it for me."*
- I pre-allocate caller-owned device buffers for `past_key`/`past_value` per layer and rebind them as outputs each step.
- Decode latency drops to ~15 ms/token. That's the ~13× number in the headline.

## Two pitfalls that cost me a day each

1. **OrtValue lifetime is tied to the IO binding.** If you create an OrtValue from a torch tensor whose storage goes out of scope, the binding silently reads garbage. Use `ortvalue_from_shape_and_type()` for caller-owned buffers; do *not* try to reuse a torch tensor across calls.
2. **Rebinding the same `io_binding` corrupts C-string pointers.** I tried to keep one binding object and re-bind tensors each step. Symptom: tensors are bound to names like `pa` and `pas` (truncated). Fix: allocate a fresh `io_binding` per decode step. Cheap.

## The numbers

- Implementation 1 (iterative deltas): ~100 ms/token.
- Implementation 2 (single graph, no cache): ~200 ms/token (worse, because of the per-step KV transit).
- Implementation 2 + KV cache + IOBinding: ~15 ms/token.
- PyTorch + PEFT reference, same model and hardware: ~30 ms/token. So this is ~2× faster than the PyTorch baseline.

## What this unlocks

- Multiple LoRA adapters share one base graph; each adapter binary is just two matrices per layer.
- On an NPU target, this collapses "N separate 1.5B models" down to "one 1.5B + N tiny adapters."
- The same trick applies to any compile-once-then-run-many deployment story.

## Close

ONNX Runtime is a tensor scheduler. The fast path is the one where tensors don't move. Everything else — graph topology, where the LoRA math lives — is downstream of "stop copying."
