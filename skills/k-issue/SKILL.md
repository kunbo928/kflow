---
name: k-issue
description: 复现并诊断既有行为故障；获得修复授权后用同一症状证明 red → green。
argument-hint: "[问题]"
---

# k-issue

先读项目地图，再读 [`references/debug.md`](references/debug.md)。使用 `kflow work` 创建或恢复 `works/issue-{slug}/`；`spec.md` 保存稳定契约，`work.md` 保存活动状态和证据。

Spec Clear 要求明确用户可见症状、期望行为、环境、复现条件、边界和可重复复现信号。诊断请求不等于修复授权；只诊断时不修改产品代码或测试，只记录有证据的根因或剩余可证伪假设。

修复前先观察同一故障症状 `red`。形成可证伪假设，隔离根因，修改最小完整原因而不是最近的表象。用同一信号观察 `green`，再运行原始复现和受影响回归。没有能变红的信号时报告阻塞，不猜测修复。

最后执行 Spec 与 Standards 双轴审查，并确认回归测试在移除修复后会失败。把已证实根因、证据和上下文同步写入 `spec.md`。验收、双轴审查和同步完成后才能标记 accepted；报告 `work.md` 是否具备删除条件，由用户决定。
