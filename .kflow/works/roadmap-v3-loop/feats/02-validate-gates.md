---
id: FEAT-02
status: accepted
depends_on:
  - FEAT-01
---

# CLI 校验门

## 目标行为

`work validate` 在 `active`/`accepted` 时拒绝空的 Spec Clear 章节；`accepted` 时还要求验证证据、交付结果四小节、以及审查记录形状。`map validate` 检查「上下文路由」里仓库相对路径存在。`doctor --fix` 不重建 `lessons/` 或 `attention.md`。

## 范围与非目标

只改 `packages/cli/src/harness.ts`、`commands.ts` 与对应测试。不判章节写得对不对、不跑测试、不核验 reviewer 身份。finding 分级对错仍归 Skill。

## 验收场景

1. 独立 feat 标 `active` 且「目标行为」为空 → validate 失败；写入正文后通过。
2. `accepted` 但 `work.md`「验证证据」为空 → 失败。
3. `accepted` 审查节缺 base/head，或终态不是 `review_passed`/`risk_accepted` → 失败。
4. 审查节含未勾掉的 blocking 或 important 标记 → 失败；仅 nit 未勾不挡。
5. `index.md` 上下文路由指向不存在的路径 → `map validate` 失败；路径存在则通过。
6. 项目里已有 `attention.md` 时 `doctor --fix` 不把它当成必须资产重建。

## 测试契约

接缝：`packages/cli/tests/cli.test.mjs`（及如有必要的 harness 单测）。每个场景一条断言：构造最小 Work/地图 → `work validate` / `map validate` / `doctor` 的 JSON `ok` 与错误文案。先 red 再改 harness。

## 关键决策

审查形状认记录里的 `review_passed` / `risk_accepted`、git SHA、以及 `- [ ] blocking` / `- [ ] important` 这类未勾标记。不解析自由散文里的严重级别词。

## 交付结果

### 实现

`active`/`accepted` 要求 Spec Clear 章节有正文。`accepted` 校验验证证据、审查节 base/head 与 `review_passed`|`risk_accepted`、未勾 blocking/important。`map validate` 检查上下文路由指针存在。

### 验证

`npm run check`：`active and accepted Works require Spec Clear body and review shape`、`map validate requires context-route pointers to exist`。

### 审查

随父级独立双轴审查 `review_passed`。

### 上下文同步

无。
