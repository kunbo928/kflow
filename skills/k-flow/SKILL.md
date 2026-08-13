---
name: k-flow
description: kflow 统一入口。读取项目上下文、收敛诉求并路由到唯一负责 Skill。
argument-hint: "[诉求]"
---

# k-flow

处理非平凡诉求时，先读 `.kflow/project-map/index.md`，再按当前范围渐进加载相关指针。地图缺失或仍是未核实骨架时，先调用 `k-onboard`，随后在同一会话继续原诉求。

调查仓库事实，只把诉求收敛到足以选择唯一负责人：

| 诉求 | 负责人 |
| --- | --- |
| 包含多个依赖交付项的大需求 | `k-roadmap` |
| 新增或改变可观察行为 | `k-feat` |
| 既有行为故障、报错或回退 | `k-issue` |
| 已批准的行为等价结构改动 | `k-refactor` |
| 只调研证据、不实施 | `k-research` |
| 用可丢弃产物回答一个决策 | `k-prototype` |
| 架构审计或设计 | `k-architecture` |
| 项目地图与事实归宿漂移 | `k-reconcile` |
| 只读审查 | `k-review` |
| 稳定经验与事实归宿 | `k-knowledge` |

同一会话移交原始诉求、已核实事实及来源、已确认决定、范围、非目标、验收意图和未决风险。入口不创建半成品 Spec；负责 Skill 达到 Spec Clear，且不重复询问已确认事项。路由不扩大实现、提交、发布或外部写入授权。独立诉求需要先确定顺序。
