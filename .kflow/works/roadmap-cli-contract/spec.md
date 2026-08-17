---
type: roadmap
status: accepted
---

# CLI 状态投影与统一 JSON 契约

## 目的地

`kflow` 各命令在 `--json` 下输出一个版本化、稳定、可被 Agent 严格解析的诊断 envelope；`work show` 对 roadmap 额外派生 `frontier / blocked / next`。让下一会话仅凭 CLI 投影即可选出正确动作，而不必重读自然语言输出。落点全在 `packages/cli/`，不新增第二套事实系统。

## 范围与非目标

范围：`packages/cli/src/`（`commands.ts`、`harness.ts`、`types.ts`、`cli.ts`）、`packages/cli/tests/`、`docs/kflow-v3-design.md` 的 CLI 边界一句授权、Changeset。

非目标：不改 Work 两文件模型与 6 类章节契约；不引入跨 Work 的 `depends_on`（依赖仍只在 roadmap `feats/`）；不让 CLI 跑测试或评判 finding 对错；不维护第二套规格库；本 Roadmap 内不发布 npm。

## 整体验收

- 全部命令（`init`/`doctor`/`status`/`map validate`/`work create`/`work show`/`work validate`/`document *`）在 `--json` 下输出单一文档、含版本化 envelope（统一 `ok` 与 `diagnostics[]{severity,code,message,target?,fix?}`）。
- 失败退出码稳定：成功含健康提醒 `0`；`--json` 命令失败或校验有失败项 `1`；交互取消 `130`。
- `work show <roadmap>` 输出 `frontier[]`、`blocked[]{id,missing[]}`、`next`，且同层并列按 feat 文件声明顺序确定性打破。
- 新 envelope 直接取代旧问题通道；旧 `errors` / `issues` / `invalid` 不再并存。`status.counts` 仍是命令载荷。
- `docs/kflow-v3-design.md` 的 CLI 边界写明「只读派生投影（如 frontier）不算语义判断」。
- `npm run check` 通过；新增契约测试锁定 envelope 与投影形状。

## 关键决策

- 载体与顺序：FEAT-01 先定 JSON 契约，FEAT-02 状态投影依赖并遵守它（见 grilling 第 1 轮 Q1）。
- 契约覆盖全部命令（Q2）。
- 无已知机器消费者，按可直接替换处理，保留 exit code 语义（Q3）。
- CLI 从 `status` 机械派生 frontier 属形状范畴，需在设计文档显式授权（Q4）。
- exit code 与 diagnostic envelope 沿用 OpenSpec 已验证惯例（AFK，见 `docs/research/openspec-lessons-for-kflow.md` P0）。

## 尚未明确

无。envelope 具体字段与 diagnostic code 表是 AFK 工程细节，落在各 Feature 的测试契约，不是路线级迷雾。

## Feature 索引

- FEAT-01 · 统一 JSON 诊断契约（accepted）
- FEAT-02 · Roadmap 状态投影（accepted，依赖 FEAT-01）

## 交付结果

### 实现

FEAT-01 envelope + FEAT-02 `work show` 投影。落点 `packages/cli/src/`。

### 验证

`npm run check` 45/45。契约测试 `json-contract.test.mjs`、`roadmap-projection.test.mjs`。

### 审查

base `98b15ae7df07386b6578caa28982ffccca2f7476`。独立 Spec/Standards 复审均 `review_passed`。

### 上下文同步

`docs/kflow-v3-design.md`、中英文 README、`.changeset/cli-json-envelope.md`。
