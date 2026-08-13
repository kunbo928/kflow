---
name: k-refactor
description: 在可观察 green 基线上实施已批准的行为等价结构改动。
argument-hint: "[重构目标]"
---

# k-refactor

先读项目地图，并用 `kflow work` 创建或恢复 `works/refactor-{slug}/`。本 Skill 只负责实施：开放式架构分析交给 `k-architecture`，项目地图漂移交给 `k-reconcile`。

Spec Clear 要求明确可观察等价边界、结构目标、受影响调用方、非目标和权威基线。修改前运行现有行为检查；覆盖不足时先增加 characterization test 并观察 green。类型检查、lint 和快照不能单独证明运行时等价。

小步改变结构，每一步都运行最窄等价信号并保持 green；最终覆盖受影响调用方和必要的性能对比。若正确实现必须改变外部行为，停止并转 Feature；若发现既有行为错误，转 Issue。

执行 Spec 与 Standards 双轴审查，记录 green → green 证据和上下文同步。只有验收与双轴审查通过后才能标记 accepted；报告 `work.md` 是否具备删除条件，由用户决定。
