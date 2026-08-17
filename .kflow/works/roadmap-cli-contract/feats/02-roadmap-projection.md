---
id: FEAT-02
status: accepted
depends_on: [FEAT-01]
---

# Roadmap 状态投影

## 目标行为

`kflow work show <roadmap> --json` 在遵守 FEAT-01 envelope 的前提下，额外输出 roadmap 的可行动状态：`frontier[]`（`depends_on` 全部 accepted 的 proposed feat id）、`blocked[]{id,missing[]}`（有未满足依赖的 feat 及缺失依赖）、`next`（frontier 中按 feat 文件声明顺序的第一个）。非 roadmap Work 不含这些字段。

## 范围与非目标

范围：把 `harness.ts` 中 `validateRoadmapFeats` 已计算的依赖图抽出为可复用查询，供 `showWork` 投影；`commands.ts` 的 `showWork` 增加 roadmap 分支。非目标：不引入跨 Work 依赖；不改依赖环/父子终态的校验规则；不预测「就绪度」以外的语义（不判断 feat 内容质量）。

## 验收场景

- 一个含 FEAT-01(accepted)、FEAT-02(proposed, depends_on FEAT-01)、FEAT-03(proposed, depends_on FEAT-02) 的 roadmap → `frontier:["FEAT-02"]`、`blocked:[{id:"FEAT-03",missing:["FEAT-02"]}]`、`next:"FEAT-02"`。
- 全部 feat accepted → `frontier:[]`、`blocked:[]`、`next:null`。
- 同层两个都就绪 → `next` 取文件名编号靠前者，跨多次运行稳定。
- 非 roadmap Work 的 `work show --json` 不含 `frontier/blocked/next` 键。

## 测试契约

扩展 `packages/cli/tests/`（新增或并入 workflow-scenarios）：用 fixture roadmap 断言上述四个场景的 `frontier/blocked/next`；断言确定性排序；断言 feat 依赖不存在时仍由校验层报错而非投影层崩溃。先写红：`work show` 当前无 `frontier` 键 → 断言失败，再实现使之绿。

## 关键决策

frontier 定义与 `k-roadmap` 正文一致：`depends_on` 全部 accepted 的 proposed feat。派生只读 `status` 字段，不做语义判断（依赖 FEAT-01 的 envelope 承载）。

## 交付结果

### 实现

`harness.ts` 导出 `roadmapProjection`；`showWork` 对 roadmap 写入 `frontier` / `blocked` / `next`。非 roadmap 不含 `frontier`/`blocked`/`next`；「下一步」在 `nextStep`。

### 验证

`packages/cli/tests/roadmap-projection.test.mjs`：依赖链、全 accepted、同层排序稳定、非 roadmap 不含投影键、缺失依赖由校验层报错。`npm run check` 通过。

### 审查

同上冻结 diff，独立双轴复审 `review_passed`。

### 上下文同步

设计文档授权「只读派生投影不算语义判断」；README 写明 roadmap `work show` 投影字段。
