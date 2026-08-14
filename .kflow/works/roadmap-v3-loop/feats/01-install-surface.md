---
id: FEAT-01
status: accepted
depends_on: []
---

# 安装面与 Work 类型

## 目标行为

`kflow init` 安装 v3 产品 Skill 集，创建 `works/` 与 `project-map/`，不创建 `lessons/` 或 `attention.md`。`work create` 只接受 `roadmap|feat|issue|refactor|research|prototype`。CLI 不再接受 `--skill`。

## 范围与非目标

改 `packages/cli/src/` 的类型、清单、init/doctor/create、cli 入口；新增三个 Skill 目录的最小 `SKILL.md`（可先薄，正文在 FEAT-03 写满）；删除 `skills/k-architecture`。不在本项改校验门细则（FEAT-02）或 README（FEAT-04）。

## 验收场景

1. `init --tools none`（或测试里的 `--tools codex,claude`）后：无 `.kflow/attention.md`，无 `.kflow/lessons/`；有 `.kflow/works/` 与 `.kflow/project-map/index.md`。
2. `.agents/skills/` 含 `k-implement`、`k-grilling`、`k-author`，不含 `k-architecture`。
3. `work create architecture x` 失败。
4. `kflow status --skill k-flow` 失败（未知选项或等价拒绝）；`kflow status` 成功。
5. 已存在的 `attention.md` / `lessons/` 不导致 `doctor` 失败。

## 测试契约

接缝：`node --test packages/cli/tests/cli.test.mjs`（先 `npm run build`）。改现有 `init creates Project Map...` 与 `--skill` 用例，使上述场景 red → green。不在本项加 harness 的 Spec Clear 非空断言。

## 关键决策

新产品 Skill 在本项即可被 init 拷走，故必须先有目录和 `SKILL.md`。FEAT-03 再写闭环正文与 references。

## 交付结果

### 实现

产品包含 `k-implement` / `k-grilling` / `k-author`，无 `k-architecture`。Work 类型去掉 architecture。CLI 拒绝 `--skill`。init 不建 `lessons/`、`attention.md`。

### 验证

`npm run check`：init 安装面、`work create architecture` 失败、`--skill` 未知选项。

### 审查

随父级独立双轴审查 `review_passed`。

### 上下文同步

无（公开文档在 FEAT-04）。
