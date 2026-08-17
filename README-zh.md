<div align="center">

# kflow

**让 AI 按软件工程闭环完成工作，而不是只生成一段看似合理的代码。**

[English](README.md) · 简体中文

![status](https://img.shields.io/badge/status-beta-F59E0B?style=flat-square)
![skills](https://img.shields.io/badge/skills-14-2F7A5E?style=flat-square)

</div>

kflow 是一套面向 AI 编码 Agent 的工程工作流。它把工作交给对应 Skill，并要求 Agent 用可重复的证据证明结果。

你仍然在熟悉的项目、代码库、测试和文档中工作。kflow 不接管项目管理，不复制一套需求或架构系统，也不会让普通任务先填写一堆流程文件。

## 它解决什么问题

AI 很容易直接开始改代码，但经常缺少三个关键环节：先确认真正目标、用同一个信号验证前后变化、把值得保留的事实放回项目的正确位置。

kflow 为不同类型的工作提供不同闭环：

| 你要做的事 | kflow 如何推进 | 完成证据 |
|---|---|---|
| 新增或改变功能 | 拷问至 Spec Clear，再实现最小完整改动 | 目标行为 `red → green` |
| 修复 Bug | 先复现同一个用户症状；诊断不等于修复授权 | 故障症状 `red → green` |
| 重构代码 | 修改前建立行为基线，过程中保持等价 | 行为基线 `green → green` |
| 推进大目标 | 拆分依赖、决策点和可验收交付项 | 子项证据 + 整体验收 |
| 审查代码 | 冻结 git `base`/`head`，按严重程度报告发现 | 独立 `review_passed` 或 owner `risk_accepted` |

风险低、方向清楚的任务直接完成；只有高风险、跨会话或多交付项工作才增加检查点和恢复记录。

## 安装

需要 Node.js 20 或更高版本。全局安装 CLI，然后在你的项目根目录初始化：

```bash
npm install -g @kunbo0928/k-flow@latest
cd your-project
kflow init
```

`init` 会把 14 个 Skill 安装到 `.agents/skills/`，建立渐进式 Project Map 与 Works 骨架，并自动连接项目中检测到的 Agent 平台。不创建 `lessons/` 或 `attention.md`。

显式指定平台或安装全部平台：

```bash
kflow init --tools codex,claude
kflow init --tools all
```

交互式 `init` 会打开可搜索的平台选择器，并预勾选检测到的 Agent。传入 `--yes`（或 `-y`）可跳过选择，直接安装到所有检测到的 Agent。非交互环境中如果无法检测到 Agent，必须通过 `--tools` 明确指定。不支持符号链接时使用 `--copy`，替换已有平台集成时使用 `--force`。

## 怎么使用

初始化后，直接在 Agent 对话中描述任务即可。`k-flow` 是统一入口：先读项目地图，再选定 Work 类型和当前步骤。

```text
用 kflow 给订单列表增加 CSV 导出。

用 kflow 排查登录后偶发回到登录页的问题，先只诊断。

用 kflow 重构这段缓存逻辑，保持现有行为不变。

用 kflow 为支付模块迁移制定并执行路线图。

用 kflow 审查这个 PR，只报告问题，不修改产品代码。
```

典型执行路径：

```text
你的目标
  ↓
k-flow 选定 Work 类型与当前步骤
  ↓
k-grilling 至 Spec Clear → k-implement（red → green）→ k-review → k-knowledge
  ↓
读取真实代码与项目约定
  ↓
交付代码、验证结果、剩余风险，并把稳定事实写回 AGENTS.md / project-map
```

每个有边界的工作使用一个 `.kflow/works/{type}-{slug}/`：`spec.md` 保存稳定契约，`work.md` 保存活动状态；完成后是否保留 `work.md` 由用户决定。

## 14 个 Skill

| Skill | 用途 |
|---|---|
| `k-flow` | 统一入口，选定 Work 类型和当前步骤 |
| `k-onboard` | 建立经过核实的项目地图和 AGENTS 契约 |
| `k-feat` | 新增或改变用户可观察行为 |
| `k-issue` | 复现、诊断并在获得授权后修复问题 |
| `k-refactor` | 保持行为等价地改进内部结构 |
| `k-roadmap` | 管理多交付项目标、依赖、决策与整体验收 |
| `k-research` | 基于一手证据调研，不扩大实现授权 |
| `k-prototype` | 用可丢弃原型回答一个决策问题 |
| `k-reconcile` | 以代码和事实 owner 为准校准 Project Map |
| `k-implement` | 对着已有 spec 做 TDD；不新建 Work 类型 |
| `k-grilling` | 拷问至 Spec Clear；已清则零提问 |
| `k-review` | 对冻结 `base`/`head` 做独立双轴审查 |
| `k-knowledge` | 把稳定事实写回 AGENTS.md 或 project-map |
| `k-author` | 怎么写给 Agent 看的 AGENTS.md、地图和 Skill |

每个 Skill 都可以独立使用，并遵循开放的 Agent Skills 目录格式。Skill 负责语义判断和工程方法；CLI 只负责安装、形状/非空/路径校验、恢复和文档查询。

## 常用 CLI

```bash
kflow doctor
kflow status
kflow work create feat export-csv --summary "导出 CSV"
kflow work show feat-export-csv --json
kflow work validate feat-export-csv
kflow map validate
kflow document search --dir docs --query "cache"
kflow document validate --file docs/adr/001.md --require status
```

- `doctor` 检查安装、Skill 资产和可恢复状态。遗留 `lessons/` / `attention.md` 只报告不失败。
- `status` 查看当前 Work 状态。
- `work` 创建并校验统一的 Spec 与活动状态。
- `map validate` 检查地图章节与指针路径存在。
- `document` 查询或校验项目已有文档，不创建平行文档系统。

CLI 强制形状、非空和路径存在。`--json` 输出版本化 envelope（`schemaVersion`、`ok`、`diagnostics[]`）。`work show` 对 roadmap 额外投影 `frontier` / `blocked` / `next`。不跑测试、不判拷问、不核验「reviewer 是不是实施者」。

## 项目中会增加什么

```text
.agents/skills/       # 14 个 Skill 的规范副本
.kflow/
├── project-map/      # 渐进式项目全貌导航
└── works/            # 统一的 roadmap、任务与探索 Work
```

AI 入口只有根 `AGENTS.md` 与 project-map。稳定事实仍进入项目已有的代码、测试、README、产品文档或 ADR。旧版 `.kflow` 内容不会被自动删除或批量迁移。

## 开发 kflow

```bash
git clone https://github.com/kunbo928/kflow.git
cd kflow
npm install
npm run check
npm pack --dry-run
```

CLI 源码位于 `packages/cli/`，Skill 位于 `skills/`。
