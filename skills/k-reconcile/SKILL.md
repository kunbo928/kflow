---
name: k-reconcile
description: 以当前代码和正式事实归宿为准，校准项目地图与 Agent 上下文。
argument-hint: "[范围或完整地图]"
---

# k-reconcile

读取 `.kflow/project-map/index.md` 以及请求范围内的全部地图分支。逐项对照当前源码、测试、manifest、项目文档和 `AGENTS.md`，检查指针、命令、模块边界、事实归宿和局部规则。代码与正式 owner 优先；时间戳本身不能证明漂移。

直接修正机械漂移：路径缺失或改名、已核实命令变化、owner 文档迁移，以及事实明确的导航变化。项目目的、模块职责、架构边界或协作规范变化必须已有 accepted 决定或 owner 确认；校准不能发明这些决定。

通常直接返回上下文 diff 和验证，不创建永久 Work。审计较大、跨会话或需要恢复时，使用最接近的 Work 类型：边界有争议时用 Architecture，其他情况先由用户批准载体，禁止创建第二份地图。

完成标准：范围内每个指针有效或明确标为“未知”，`kflow map validate --skill k-reconcile` 通过，剩余决策已路由。
