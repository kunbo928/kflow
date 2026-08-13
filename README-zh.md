<div align="center">

# kflow

**让 AI 按软件工程闭环完成工作，而不是只生成一段看似合理的代码。**

[English](README.md) · 简体中文

![status](https://img.shields.io/badge/status-beta-F59E0B?style=flat-square)
![skills](https://img.shields.io/badge/skills-8-2F7A5E?style=flat-square)

</div>

kflow 是一套面向 AI 编码 Agent 的工程工作流。它把功能开发、问题修复、重构、路线图和代码审查分别交给对应 Skill，并要求 Agent 用可重复的证据证明结果。

你仍然在熟悉的项目、代码库、测试和文档中工作。kflow 不接管项目管理，不复制一套需求或架构系统，也不会让普通任务先填写一堆流程文件。

## 它解决什么问题

AI 很容易直接开始改代码，但经常缺少三个关键环节：先确认真正目标、用同一个信号验证前后变化、把值得保留的事实放回项目的正确位置。

kflow 为不同类型的工作提供不同闭环：

| 你要做的事 | kflow 如何推进 | 完成证据 |
|---|---|---|
| 新增或改变功能 | 明确目标行为，再实现最小完整改动 | 目标行为 `red → green` |
| 修复 Bug | 先复现同一个用户症状，再诊断和修复 | 故障症状 `red → green` |
| 重构代码 | 修改前建立行为基线，过程中保持等价 | 行为基线 `green → green` |
| 推进大目标 | 拆分依赖、决策点和可验收交付项 | 子项证据 + 整体验收 |
| 审查代码 | 冻结审查范围，按严重程度报告发现 | 可定位、可行动的 findings |

风险低、方向清楚的任务直接完成；只有高风险、跨会话或多交付项工作才增加检查点和恢复记录。

## 安装

需要 Node.js 20 或更高版本。全局安装 CLI，然后在你的项目根目录初始化：

```bash
npm install -g k-flow@latest
cd your-project
kflow init
```

`init` 会把 8 个 Skill 安装到 `.agents/skills/`，并自动连接项目中检测到的 Agent 平台。它支持与 K Teach 一致的 35 个 Agent 工具，包括 Codex、Claude Code、Cursor、OpenCode、Gemini CLI、GitHub Copilot、Windsurf 和 WorkBuddy 等。

显式指定平台或安装全部平台：

```bash
kflow init --tools codex,claude
kflow init --tools all
```

不支持符号链接时使用 `--copy`。替换已有平台集成时使用 `--force`。

## 怎么使用

初始化后，直接在 Agent 对话中描述任务即可。`k-flow` 是统一入口，会判断这是执行、讨论、建议还是导览，并把工程任务交给正确的 Skill。

```text
用 kflow 给订单列表增加 CSV 导出。

用 kflow 排查登录后偶发回到登录页的问题，先只诊断。

用 kflow 重构这段缓存逻辑，保持现有行为不变。

用 kflow 为支付模块迁移制定并执行路线图。

用 kflow 审查这个 PR，只报告问题，不修改代码。
```

典型执行路径：

```text
你的目标
  ↓
k-flow 判断任务类型与授权边界
  ↓
k-feat / k-issue / k-refactor / k-roadmap / k-review
  ↓
读取真实代码与项目约定
  ↓
建立反馈信号 → 完成改动 → 用同一信号验证
  ↓
交付代码、验证结果、剩余风险与必要知识
```

普通任务不会创建游标。跨会话恢复、交接、大型 Roadmap 或你明确要求留痕时，才使用 `.kflow/cursors/` 保存最小恢复游标。

## 8 个 Skill

| Skill | 用途 |
|---|---|
| `k-flow` | 统一入口，理解诉求并路由到正确工作流 |
| `k-onboard` | 接入现有项目，识别代码、测试、文档与约定 |
| `k-feat` | 新增或改变用户可观察行为 |
| `k-issue` | 复现、诊断并在获得授权后修复问题 |
| `k-refactor` | 保持行为等价地改进内部结构 |
| `k-roadmap` | 管理多交付项目标、依赖、决策与整体验收 |
| `k-review` | 对明确范围进行只读代码审查 |
| `k-knowledge` | 管理注意事项、经验和长期事实归宿 |

每个 Skill 都可以独立使用，并遵循开放的 Agent Skills 目录格式。Skill 负责语义判断和工程方法；CLI 只负责适合确定性执行的安装、检查、恢复和文档查询。

## 常用 CLI

```bash
kflow doctor
kflow status
kflow cursor create k-feat export-csv --summary "导出 CSV"
kflow cursor show export-csv --json
kflow cursor validate .kflow/cursors/export-csv.md
kflow document search --dir docs --query "cache"
kflow document validate --file docs/adr/001.md --require status
```

- `doctor` 检查安装、Skill 资产和可恢复状态。
- `status` 查看当前活动游标数量。
- `cursor` 只管理必要的跨会话恢复信息。
- `document` 查询或校验项目已有文档，不创建平行文档系统。

## 项目中会增加什么

```text
.agents/skills/       # 8 个 Skill 的规范副本
.kflow/
├── attention.md      # 几乎每次任务都必须知道的少量事实
├── cursors/          # 可选的恢复游标，完成即删
└── lessons/          # 尚未进入项目正式归宿的经验
```

稳定事实仍进入项目已有的代码、测试、README、产品文档、ADR 或架构文档。旧版 `.kflow` 内容不会被自动删除或批量迁移。

## 开发 kflow

```bash
git clone https://github.com/kunbo928/kflow.git
cd kflow
npm install
npm run check
npm pack --dry-run
```

CLI 源码位于 `packages/cli/`，Skill 位于 `skills/`。
