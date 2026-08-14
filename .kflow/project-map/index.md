# Project Map

kflow 是技能包仓库，不是应用项目。交付物是产品 `k-*` Skill 加 `packages/cli` 里的确定性 CLI。

## 项目边界

- 做：跨平台工程 Skill、CLI 的 init/doctor/work/map/document、把 Skill 链到各 Agent 目录。
- 不做：调用方项目的需求库、架构库、项目管理、第二套生命周期数据库。
- 行为真相：`skills/`、`packages/cli/`、测试与 `package.json` scripts。规格真源：`docs/kflow-v3-design.md`。

## 上下文路由

- 怎么干活：`AGENTS.md`、`CLAUDE.md`
- 规格：`docs/kflow-v3-design.md`
- Skill 正文：`skills/`
- CLI：`packages/cli/src/`；校验：`npm run check`
- 测试：`packages/cli/tests/`
- 发布面：`README.md`、`README-zh.md`、`index.html`、`.claude-plugin/plugin.json`、`.changeset/`
