# AGENTS

kflow 是一组跨平台工程 Skill，加一个确定性 CLI。Skill 负责语义判断，CLI 负责确定性执行、验证、恢复与上下文压缩；它不接管项目已有事实系统。

## 项目性质

- 本项目是技能包仓库，不是应用项目。
- 当前交付 8 个 AgentSkills.io Skill：`k-flow`、`k-onboard`、`k-feat`、`k-issue`、`k-refactor`、`k-roadmap`、`k-review`、`k-knowledge`。
- `kflow init` 将 Skill 安装到目标项目 `.agents/skills/`，再为检测到的 Agent 平台建立链接或副本。
- 普通任务不创建游标；`.kflow/cursors/` 只保存必要的恢复游标。

## 工作方式

- 修改 Skill 行为：改对应 `skills/k-*/SKILL.md`。
- 修改 CLI：改 `packages/cli/src/`，同步 `packages/cli/tests/`。
- 修改公开行为：同步中英文 README、插件清单、npm 文件清单和 Changeset。
- 架构与迁移边界以 `docs/kflow-v2-design.md` 为准。

## 约束

- Skill 相互独立，不读取 sibling Skill 文件，不依赖项目内共享 reference runtime。
- 单个 Markdown 不超过 300 行。
- 新项目只默认创建 `.kflow/attention.md`、`.kflow/cursors/`、`.kflow/lessons/`。
- 稳定事实进入调用方项目已有 canonical owner，不默认创建平行需求、架构或文档系统。
- Feature 使用目标行为 `red → green`；Issue 使用故障症状 `red → green`；Refactor 使用行为基线 `green → green`。
- 修改后至少运行 `npm run check`；发布面变化还要运行 `npm pack --dry-run`。
