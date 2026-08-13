---
name: k-onboard
description: 仓库接入 kflow：创建最小项目骨架。
---

# k-onboard

给仓库一个最小的 kflow 骨架。规则和纪律都在 skill 包里，项目目录只放项目自己的知识。

## 骨架（目标状态）

```text
.kflow/
├── attention.md    # 每次会话必读的项目事实，≤25 条，从空开始
├── lessons/        # 尚未进入更强 owner 的可复用经验，一条一文件
├── cursors/        # 活动任务的跨会话恢复游标，完成即清
└── cli-invocations.jsonl # 首次 Skill 调用 CLI 时懒创建，最多 200 条
```

创建后确认 `.kflow/` 未被 .gitignore 忽略（它必须入库共享）；发现被忽略时停下报告，由用户决定怎么改，不擅自修改 .gitignore。attention.md 初始只写一行标题和一句用途说明，不预置分节模板。`cli-invocations.jsonl` 不由 onboard 预建，只在 Skill 带 `--skill` 调用 CLI 时创建；记录不得包含自由文本参数或查询内容。`.kflow/roadmaps/` 不属于基础骨架：首次 Roadmap 优先沿用项目已有 roadmap / RFC / initiative 归宿，没有时才由 `k-roadmap` 按需创建。

## 硬门槛

- 只创建缺失的 `attention.md`、`lessons/` 与 `cursors/`，不覆盖已有内容。
- 不复制 Skill 包内文件到项目；项目目录只保存项目自己的知识和恢复游标。
- 不创建需求、架构、路线图或其他平行事实系统；沿用项目已有 canonical owner。

## 收尾

报告创建了哪些文件以及 `.kflow/` 的 git 状态。不写入任何业务判断。
