---
type: roadmap
status: accepted
baseline:
  git_head: 6918a60cb69f714dc7cd76e96fea24089d810d4f
  dirty_paths:
    - docs/kflow-v3-design.md
---

# 按 v3 规格改写 Skill 与 CLI · 执行记录

## 当前状态

四条切片已落地并通过独立双轴审查。`review_passed`。

## 下一步

由用户决定是否保留本文件。未提交。

## 验证证据

- FEAT-01：init 产品面 14 Skill、拒 architecture/`--skill`、不建 lessons/attention。
- FEAT-02：Spec Clear 非空（含 roadmap/research/prototype 父级）、accepted 审查形状、map 指针存在、`doctor --fix` 不重建遗留 attention/lessons。
- FEAT-03：闭环点名 grilling/implement/review/knowledge；手法 references；k-review 未勾 blocking/important 不能 `review_passed`。
- FEAT-04：README/plugin/AGENTS/CLAUDE/Changeset 与安装清单一致。
- `npm run check` 36 pass；`node dist/kflow.mjs map validate --json` → ok；`npm pack --dry-run` 含新 Skill、不含 `k-architecture`。

## 审查

base: 6918a60cb69f714dc7cd76e96fea24089d810d4f
head: a9087480640b4b298df058a25e7cca0cd299d3d6
review_passed

独立子代理复审（Spec / Standards）。工作区未提交；head 为审查时产品树 SHA。

- [x] important Spec Clear 覆盖 roadmap/research/prototype — resolved
- [x] important doctor --fix 不重建 attention — resolved
- [x] important k-review important 挡 review_passed — resolved
- [ ] nit CLI 章节清单仍有多份拷贝（不挡）
- [ ] nit 实施主人点名后仍复述 TDD（不挡）

## 上下文同步

本仓 `AGENTS.md`、`CLAUDE.md`、`.kflow/project-map/index.md` 已按 v3 规格更新。

## 阻塞
