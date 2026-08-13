# kflow v3：项目地图与 Work

## 目标

kflow 提供可持续维护的项目上下文，并用一条连续工程闭环推进工作：

`项目地图 → 路由 → Spec Clear → 反馈闭环 → 审查 → 上下文同步`。

项目地图提供低分辨率上下文；一个 Work 负责一项有边界的工作。源码、测试、manifest、项目文档、ADR 和局部 `AGENTS.md` 仍是详细事实的正式归宿。

## 项目上下文

`.kflow/project-map/` 是渐进加载的导航树：

```text
project-map/
├── index.md
├── development.md       # 按需
├── architecture.md      # 按需
└── areas/               # 按需
```

非平凡任务首先读取 `index.md`。它记录项目边界、主要区域，以及何时加载其他地图文件。地图条目指向正式事实归宿并说明校验方式，不复制文件树、API 定义、依赖版本或临时进度。

根 `AGENTS.md` 保存稳定协作规则和项目地图加载契约。首次接入时，文件不存在则创建最小版本；已有文件只增加有边界的 kflow 区块。规则冲突或无法核实时交由 owner 决定。

地图新鲜度由证据判断。指针失效、命令失败或与正式 owner 冲突才算漂移。日常任务校验本次触及的指针；`k-reconcile` 全量对照代码与正式文档。

## Work

每项工程或探索工作拥有一个目录：

```text
.kflow/works/
├── roadmap-payment-migration/
│   ├── spec.md
│   ├── work.md
│   └── feats/
│       ├── 01-payment-adapter.md
│       └── 02-cutover.md
├── feat-csv-export/
├── issue-login-redirect/
├── refactor-cache-boundary/
├── research-agent-context/
├── prototype-editor-flow/
└── architecture-module-boundaries/
```

独立 Work 包含 `spec.md` 和 `work.md`。`spec.md` 保存稳定契约与最终结果；`work.md` 保存活动状态、下一步、证据、未解决审查 finding 和恢复上下文。完成后不自动删除 `work.md`；Agent 只报告是否具备删除条件，由用户决定。

目录名使用 `{type}-{slug}`。类型包括 `roadmap`、`feat`、`issue`、`refactor`、`research`、`prototype`、`architecture`。

### Roadmap

Roadmap 是一个大需求的共享地图。`spec.md` 保存目的地、范围、非目标、决策、迷雾、Feature 索引/依赖和整体验收；子交付项保存为 `feats/NN-name.md`。编号提供稳定展示和默认推进顺序，真实依赖由 `depends_on` 表达。

Feature 文件渐进创建：能够精确陈述的交付项成为文件；尚不能精确陈述的区域留在“尚未明确”。进入执行前，路线级迷雾必须清空，每个 Feature 都要包含行为、边界、验收、可重复反馈信号和显式依赖。Roadmap 子 Feature 不再建立独立 `feat-*` Work。

## 生命周期

状态为 `proposed → active → accepted`，必要时使用 `blocked`、`cancelled`、`superseded`。

1. **路由**：`k-flow` 读取项目地图、调查仓库事实，把诉求收敛到一个负责 Skill，并移交已确认上下文。
2. **Spec Clear**：所有会改变行为、范围、验收、测试接缝、归属或真实取舍的问题已经解决。需求已经清楚时可以零提问；grilling 是完成条件，不是形式化访谈。
3. **反馈闭环**：Feature 使用目标行为 `red → green`；Issue 使用同一故障症状 `red → green`；Refactor 使用可观察基线 `green → green`。
4. **审查**：实施型 Work 最终执行 Spec 与 Standards 双轴审查。完整会话由 PR/MR/Gerrit 保存；没有外部后端时，未解决 finding 暂存 `work.md`。`spec.md` 只保留终态、证据指针和修订后的稳定契约。范围外 finding 成为新 Work。
5. **上下文同步**：稳定事实写回正式 owner；导航、边界或指针变化时更新项目地图。地图更新不能暗中创建架构决定。
6. **毕业**：`spec.md` 记录实现、验证、双轴审查和上下文同步结果。Agent 报告 `work.md` 是否安全可删，用户决定是否保留。

## Skill 拓扑

| Skill | 职责 |
| --- | --- |
| `k-flow` | 统一入口与诉求收敛 |
| `k-onboard` | 首次项目地图与 `AGENTS.md` 上下文契约 |
| `k-roadmap` | 大需求发现、Feature 图、执行与验收 |
| `k-feat` | 独立或 Roadmap 子 Feature 的目标行为交付 |
| `k-issue` | 故障复现、诊断、修复与回归 |
| `k-refactor` | 已批准的行为等价结构改动 |
| `k-research` | 不扩大实现授权的证据调研 |
| `k-prototype` | 回答一个决策的可丢弃产物 |
| `k-architecture` | 不直接实施的有界架构审计与设计 |
| `k-reconcile` | 代码、正式 owner 与项目地图漂移校准 |
| `k-review` | 只读 Spec 与 Standards 双轴审查 |
| `k-knowledge` | 稳定知识归宿和 lesson 生命周期 |

Research、Prototype、Architecture 可以是独立 Work，也可以作为既有 Roadmap/Feature 的内部资产。架构实施路由到 Refactor 或 Roadmap。Reconcile 通常直接修改上下文资产，只有确需跨会话恢复时才创建 Work。

## CLI 边界

CLI 创建并校验项目地图和 Work 形状、记录 Git 基线、报告活动状态；Skill 负责语义判断和 Markdown 正文：

```text
kflow init
kflow doctor
kflow status
kflow map validate
kflow work create <type> <slug>
kflow work show <type-slug|path>
kflow work validate <type-slug|path>
kflow document search|validate
```

旧 Cursor 命令与 `.kflow/cursors/` 被新模型替换，不保留平行兼容工作流。旧目录只作为 legacy 报告，不自动迁移或删除。
