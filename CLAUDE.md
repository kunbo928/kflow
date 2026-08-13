# kflow

跨平台工程 Skill 与确定性 CLI。Skill 负责语义判断，CLI 负责确定性执行、验证、恢复与上下文压缩；不维护第二套软件生命周期数据库。

## 项目结构

```text
skills/k-*/       # 8 个独立 Skill，按需包含自身 references 与 Agent 配置
packages/cli/     # TypeScript CLI 与端到端测试
docs/             # kflow 自身设计文档
```

## Skill 拓扑

- 入口与接入：`k-flow`、`k-onboard`
- 执行：`k-feat`、`k-issue`、`k-refactor`、`k-roadmap`
- 审查与知识：`k-review`、`k-knowledge`

## 硬约束

1. Skill 独立运行，不读取其他 Skill 包内文件。
2. 普通任务不强制创建游标；恢复游标统一放在 `.kflow/cursors/`。
3. Feature 证明目标行为 red → green；Issue 证明故障症状 red → green；Refactor 证明 green → green。
4. 项目事实写回项目已有 canonical owner，不创建 `.kflow/requirements`、`.kflow/architecture` 等平行系统。
5. 单个 Markdown 不超过 300 行。
6. 修改 Skill 或 CLI 后同步插件清单、README、测试和 Changeset，并运行 `npm run check`。
