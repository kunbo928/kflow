---
name: k-flow
description: kflow 统一入口。读取项目上下文，选定 Work 类型和当前步骤。
argument-hint: "[诉求]"
---

# k-flow

处理非平凡诉求时，先读 `.kflow/project-map/index.md`，再按当前范围渐进加载相关指针。地图缺失或仍是未核实骨架时，先调用 `k-onboard`，随后在同一会话继续原诉求。

调查仓库事实，选定 **Work 类型** 和 **当前步骤**：

| 诉求 | 当前步骤 | Work 主人 |
| --- | --- | --- |
| 地图缺失或未核实骨架 | `k-onboard` | 无 |
| 大需求 | `k-roadmap` | `roadmap-*` |
| 小需求 / 可观察行为 | `k-feat`（澄清） | `feat-*` 或子 Feature |
| 故障 | `k-issue` | `issue-*` |
| 已批准的行为等价重构 | `k-refactor` | `refactor-*` |
| 只调研 | `k-research` | `research-*` |
| 可丢弃产物回答一个决策 | `k-prototype` | `prototype-*` |
| 以代码为准修地图 | `k-reconcile` | 通常无 |
| 已有 spec，按切片实现 | `k-implement` | 不新建 |
| 实施后的门禁 | `k-review` | 不新建 |
| 记住 / 收尾写回 | `k-knowledge` | 不新建 |
| 拷问 | `k-grilling` | 不新建 |
| 写 AGENTS.md / 地图 / Skill | `k-author` | 不新建 |

同一会话移交原始诉求、已核实事实及来源、已确认决定、范围、非目标、验收意图和未决风险。入口不创建半成品 Spec；负责 Skill 达到 Spec Clear，且不重复询问已确认事项。路由不扩大实现、提交、发布或外部写入授权。独立诉求需要先确定顺序。
