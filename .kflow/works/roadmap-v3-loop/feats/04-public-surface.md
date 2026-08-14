---
id: FEAT-04
status: accepted
depends_on:
  - FEAT-01
  - FEAT-02
  - FEAT-03
---

# 公开文档与本仓入口

## 目标行为

中英文 README、插件清单、本仓 `AGENTS.md` / `CLAUDE.md` 与已安装产品面一致：无 architecture、无 `--skill`、无 lessons/attention 产品面；本仓 project-map 可被 `map validate` 通过。

## 范围与非目标

改 `README.md`、`README-zh.md`、`.claude-plugin/plugin.json`、`.changeset/`、`AGENTS.md`、`CLAUDE.md`；补齐本仓 `.kflow/project-map/` 指针。不改 Skill 行为或 CLI 逻辑。

## 验收场景

1. README 技能表与 init 安装清单一致（含 implement / grilling / author，无 architecture）。
2. 常用 CLI 示例无 `--skill`；项目骨架示例无 `attention.md` / `lessons/`。
3. `plugin.json` 的 `skills` 数组覆盖全部产品 k-*。
4. 有 Changeset（公开行为，minor）。
5. `AGENTS.md` / `CLAUDE.md` 不再写 12 个 Skill、architecture 路由、默认创建 lessons/attention。
6. `kflow map validate` 在本仓通过（路由指针存在）。

## 测试契约

接缝：人工对照 README/plugin 与 `skill-manifest.ts`；`npx kflow map validate --json`（或 `node dist/kflow.mjs map validate --json`）在仓库根 `ok: true`；`npm run check`；`npm pack --dry-run` 含新 skills、不含 `k-architecture`。无单独单测文件也可；plugin 数组若已有合同测试则改期望。

## 关键决策

本仓地图已在本 Roadmap 开工时搭了 `index.md`；本项只把指针校到 FEAT-03 之后的真实路径（例如新 Skill 目录）。

## 交付结果

### 实现

中英文 README、`plugin.json`、`AGENTS.md`、`CLAUDE.md`、Changeset 与 14 个产品 Skill 对齐；CLI 示例无 `--skill`；骨架无 lessons/attention。

### 验证

`npm run check` 36 pass；`node dist/kflow.mjs map validate --json` → `ok: true`；`npm pack --dry-run` 含 implement/grilling/author，不含 `k-architecture`。

### 审查

随父级独立双轴审查 `review_passed`。

### 上下文同步

本仓 `AGENTS.md` / `CLAUDE.md` / project-map 已更新。
