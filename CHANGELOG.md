# k-flow

## 1.1.0

### Minor Changes

- Align `kflow init` with K Teach by adding the same `@inquirer/core` searchable Agent platform selector, detected-platform preselection, `--yes` automation, and explicit failure for non-interactive zero-detection initialization.
- Connect cursor-owning Skills to the deterministic CLI and add bounded, redacted Skill invocation records under `.kflow/cli-invocations.jsonl`.

## 1.0.0

### Major Changes

- 6d12fd6: Redesign kflow around eight engineering Skills, a deterministic CLI harness, project-owned canonical knowledge, behavior-specific executable feedback loops, conditionally triggered prototypes, minimal project state, and optional recovery cursors.
- 6d12fd6: Rename the temporary recovery contract from `.kflow/work/` and `kflow work` to `.kflow/cursors/` and `kflow cursor`. Existing `.kflow/work/` directories are reported as legacy and are not rewritten automatically.

### Minor Changes

- 6d12fd6: Align `kflow init` with the complete K Teach Agent platform registry instead of limiting integrations to four tools.

## 0.1.0

### Initial beta

- 提供 13 个平台中立的工程工作流 Skill。
- 提供 TypeScript + tsdown 构建的确定性 CLI。
- `kflow init` 统一安装 Skill、接入 Agent 平台并创建项目 Harness。
- 提供 Feature Work、Roadmap 状态和完成门禁校验。
