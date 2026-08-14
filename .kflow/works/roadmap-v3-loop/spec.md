---
type: roadmap
status: accepted
---

# 按 v3 规格改写 Skill 与 CLI

## 目的地

调用方 `kflow init` 之后得到的产品面，以及本仓库的 Skill/CLI/文档，与 `docs/kflow-v3-design.md` 一致：唯一 Work、Skill 可接力、AI 入口只有 AGENTS.md + project-map、CLI 只强制形状/非空/路径存在。

## 范围与非目标

范围：`skills/k-*`、`packages/cli/`、中英文 README、插件清单、Changeset、本仓 `AGENTS.md` / `CLAUDE.md` / `.kflow/project-map/`。

非目标：不改 `.scratch/` 规划图；不把本仓库 `.agents/skills/` 拷进产品包；不向上游 vendored 源提 PR；不在本 Roadmap 内发布 npm。

## 整体验收

- `kflow init` 不建 `lessons/`、`attention.md`；安装产品 Skill 含 `k-implement` / `k-grilling` / `k-author`，不含 `k-architecture`。
- `work create architecture` 失败；CLI 无 `--skill`。
- `active`/`accepted` 时契约章节非空；`accepted` 时验证证据与审查记录形状符合设计文档。
- `map validate` 对「上下文路由」中的仓库相对路径查存在。
- Skill 正文点名闭环阶段；不读 sibling 文件；每个 Markdown ≤300 行。
- `npm run check` 通过；README / plugin 与安装清单一致。

## 关键决策

全部来自 `docs/kflow-v3-design.md` 已关票。本图不再重开那些取舍。

## 尚未明确

无。执行切片边界见 Feature 文件；切片本身不是路线级迷雾。

## Feature 索引

- FEAT-01 · 安装面与 Work 类型（accepted）
- FEAT-02 · CLI 校验门（accepted）
- FEAT-03 · Skill 拓扑与闭环正文（accepted）
- FEAT-04 · 公开文档与本仓入口（accepted）

## 交付结果

### 实现

14 个产品 Skill（含 implement / grilling / author，无 architecture）。CLI 拒 `--skill` 与 architecture Work。init 不建 lessons/attention。Spec Clear 非空覆盖 feat/issue/refactor/roadmap/research/prototype。审查形状与 map 指针由 CLI 强制。Skill 正文点名闭环；手法在对应 `references/`。公开文档与 plugin 已对齐。

### 验证

`npm run check` 36 pass。本仓 `map validate` ok。`npm pack --dry-run` 含新 Skill、不含 `k-architecture`。

### 审查

独立双轴审查 `review_passed`。base `6918a60cb69f714dc7cd76e96fea24089d810d4f`，head `a9087480640b4b298df058a25e7cca0cd299d3d6`。三条 important 已修并复审 resolved；两条 nit 不挡。详见 `work.md`。

### 上下文同步

`AGENTS.md`、`CLAUDE.md`、`.kflow/project-map/index.md` 已写回 v3 拓扑与入口。
