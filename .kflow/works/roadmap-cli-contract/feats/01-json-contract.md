---
id: FEAT-01
status: accepted
depends_on: []
---

# 统一 JSON 诊断契约

## 目标行为

`kflow <cmd> --json` 对所有命令输出单一 JSON 文档，形状统一为版本化 envelope：顶层 `schemaVersion`、`command`、`ok`，诊断集中在 `diagnostics[]`，每条含 `severity`（error|warning|info）、`code`（snake_case 稳定码）、`message`，可选 `target`、`fix`。命令特有数据放各自具名字段。散文与提示走 stderr，stdout 只有该 JSON 文档。

## 范围与非目标

范围：`types.ts` 的 `CommandResult` 收敛为 envelope；`commands.ts` 各命令改用统一构造；`cli.ts` 的 exit code 分派。非目标：不改各命令的语义与校验规则，只改输出形状；不改人类可读输出的信息量。

## 验收场景

- `node dist/kflow.mjs doctor --json` → stdout 可被 `JSON.parse` 且恰好一个文档；含 `schemaVersion`、`ok`、`diagnostics[]`。
- `work validate` 有失败项 → `ok:false`，`diagnostics[]` 每条有稳定 `code` 与 `fix`，退出码 `1`。
- 成功且仅健康提醒（如 legacy 目录）→ 退出码 `0`，提醒为 `severity:"warning"`。
- 旧问题通道 `errors/issues/invalid` 不再出现在任一命令 `--json` 输出。`status.counts` 仍是命令载荷。

## 测试契约

新增 `packages/cli/tests/json-contract.test.mjs`：对每个命令跑 `--json`，断言 stdout 单文档可解析、含 envelope 必填键、无旧字段；构造一个失败 Work 断言 `code`/`fix` 存在且 exit `1`；构造仅 warning 场景断言 exit `0`。先写红：断言现有输出缺 `schemaVersion` → 失败，再实现使之绿。

## 关键决策

envelope 字段名与 diagnostic code 命名沿用 OpenSpec `agent-contract.md` 惯例（snake_case code、可选键省略而非 null）。`schemaVersion` 从 `1` 起。

## 交付结果

### 实现

`types.ts` 增加 `schemaVersion=1` envelope 与 `diagnostics[]`；各命令经 `envelope()` 构造。失败项带稳定 `code`，校验失败带 `fix`。

### 验证

`packages/cli/tests/json-contract.test.mjs`：全命令 `--json` 单文档、必填键、无旧问题字段；失败 Work 断言 `code`/`fix` 且 exit 1；仅 warning 时 exit 0。`npm run check` 通过。

### 审查

base `98b15ae7df07386b6578caa28982ffccca2f7476`，工作区 head。独立双轴复审 `review_passed`。

### 上下文同步

`docs/kflow-v3-design.md` CLI 边界写明 `--json` envelope；中英文 README 同步；Changeset `cli-json-envelope`。
