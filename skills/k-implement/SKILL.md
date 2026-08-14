---
name: k-implement
description: 对着已有 spec 按切片做 TDD。无独立 Work 类型。
argument-hint: "[Work 或切片]"
---

# k-implement

对着已有 feat / issue / refactor / roadmap 子项的 `spec.md`（子项为 `feats/NN.md`）做 tracer bullet。不新建 Work 类型。下一跳从磁盘读 `spec.md` 与 `work.md`；已确认契约不准再问。手法见 [`references/tdd.md`](references/tdd.md)。

契约没有可重复红信号则退回主人。一次一个切片：先 red，只写让它绿的最小实现，再 green。Feature 目标行为 `red → green`；Issue 同一故障症状 `red → green`；Refactor 可观察基线 `green → green`。

做完点名 `k-review`。不把审查或写回当成实现步骤。
