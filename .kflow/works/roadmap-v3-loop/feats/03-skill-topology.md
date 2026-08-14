---
id: FEAT-03
status: accepted
depends_on:
  - FEAT-01
---

# Skill 拓扑与闭环正文

## 目标行为

产品 `k-*` 按设计文档点名闭环：`k-flow` 选 Work 类型和当前步骤；主人点名 `k-grilling` / `k-implement` / `k-review` / `k-knowledge`；TDD、双轴手法、领域词、诊断分别在对应 `references/`；删除 architecture 路由。

## 范围与非目标

改 `skills/k-*/`（含新包 references）。同步 `packages/cli/tests/skill-contracts.test.mjs` 与 `workflow-scenarios.test.mjs`。不改 CLI 校验逻辑（FEAT-02）；不改 README（FEAT-04）。每个 Markdown ≤300 行；不读 sibling `k-*` 文件。

## 验收场景

1. `skills/` 目录含 implement / grilling / author，无 architecture。
2. `k-flow` 路由表无 `k-architecture`，有 implement / grilling / author。
3. `k-feat` / `k-issue` / `k-refactor` / `k-roadmap` 点名 grilling 与 implement；issue 链包内诊断 reference，且诊断 ≠ 修复授权。
4. `k-review` 写独立批准者、冻结 base/head、`review_passed` / `risk_accepted`、blocking/important 挡、nit 不挡；允许隔离子代理；删除「不创建子 Agent」。
5. `k-knowledge` 写回 AGENTS.md 或 project-map，不把 lessons/attention 当写回目标。
6. `k-implement/references/` 有 TDD；`k-review/references/` 有双轴手法；`k-grilling/references/` 有领域词。
7. 合同测试不再要求 `k-architecture`；仍禁止 `../k-` 与 `_shared`。

## 测试契约

接缝：`node --test packages/cli/tests/skill-contracts.test.mjs packages/cli/tests/workflow-scenarios.test.mjs`。先改测试期望（14 个 Skill、新正则）使之 red，再写 Skill 正文。

## 关键决策

薄 SKILL、细节进 references。源材料：`.agents/skills/tdd`、`code-review`、`diagnosing-bugs`、`domain-modeling`、`grilling`、`writing-for-agents`、`implement`。改写进产品包，不让调用方点名本仓 `.agents/skills/`。

## 交付结果

### 实现

`k-flow` 按 Work 类型 + 当前步骤路由。feat/issue/refactor/roadmap 点名 grilling 与 implement。issue 链 `references/diagnose.md`。review 独立批准、冻结 base/head。knowledge 写回 AGENTS.md / project-map。TDD / 双轴 / 领域词 / 写作手法进对应 `references/`。

### 验证

`npm run check`：skill-contracts 与 workflow-scenarios 全绿（含 14 Skill、无 architecture、手法 references 存在）。

### 审查

随父级独立双轴审查 `review_passed`。

### 上下文同步

无（公开文档在 FEAT-04）。
