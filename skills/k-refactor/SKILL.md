---
name: k-refactor
description: 在可观察 green 基线上实施已批准的行为等价结构改动。
argument-hint: "[重构目标]"
---

# k-refactor

先读项目地图，并用 `kflow work` 创建或恢复 `works/refactor-{slug}/`。开放式方案讨论点名 `k-grilling`；项目地图漂移交给 `k-reconcile`。

未达 Spec Clear（可观察等价边界、结构目标、受影响调用方、非目标和权威基线）时点名 `k-grilling`；已清则零提问。

点名 `k-implement`。修改前运行现有行为检查；覆盖不足时先增加 characterization test 并观察 green。类型检查、lint 和快照不能单独证明运行时等价。

小步改变结构，每一步都运行最窄等价信号并保持 green；最终覆盖受影响调用方和必要的性能对比。若正确实现必须改变外部行为，停止并转 Feature；若发现既有行为错误，转 Issue。

点名 `k-review` 执行 Spec 与 Standards 双轴审查，点名 `k-knowledge` 做上下文同步。记录 green → green 证据和上下文同步。只有验收与双轴审查通过后才能标记 accepted；报告 `work.md` 是否具备删除条件，由用户决定。
