# 共享路径与命名

## 目录骨架

```text
.kflow/
├── attention.md
├── requirements/
│   ├── VISION.md
│   └── {slug}.md
├── architecture/
│   ├── ARCHITECTURE.md
│   └── {type}-{slug}.md
├── roadmap/
│   └── {slug}/
│       ├── {slug}-roadmap.md
│       ├── {slug}-items.yaml
│       └── drafts/
├── features/
│   └── YYYY-MM-DD-{slug}/
│       ├── {slug}-brainstorm.md
│       ├── {slug}-design.md
│       ├── {slug}-checklist.yaml
│       ├── {slug}-acceptance.md
│       └── {slug}-ff-note.md
├── issues/
│   └── YYYY-MM-DD-{slug}/
│       ├── {slug}-report.md
│       ├── {slug}-analysis.md
│       └── {slug}-fix-note.md
├── refactors/
│   └── YYYY-MM-DD-{slug}/
│       ├── {slug}-scan.md
│       ├── {slug}-refactor-design.md
│       ├── {slug}-checklist.yaml
│       └── {slug}-apply-notes.md
├── compound/
│   └── YYYY-MM-DD-{doc_type}-{slug}.md
├── brainstorms/
│   └── {slug}/
│       └── brainstorm.md
├── skills/
├── tools/
└── reference/
```

## 命名规则

- requirement：`requirements/{slug}.md`，不带日期；中心索引 `requirements/VISION.md`
- roadmap：`roadmap/{slug}/`，不带日期
- feature / issue / refactor：`YYYY-MM-DD-{slug}`
- compound：`compound/YYYY-MM-DD-{doc_type}-{slug}.md`
- architecture：`architecture/{type}-{slug}.md`；总入口固定 `ARCHITECTURE.md`
- attention：固定 `.kflow/attention.md`；路由类技能只检查存在，执行类技能启动前读取短清单

## 架构文档同类聚合

`architecture/` 下用文件名第一段作 type。某 type 在根目录达到 6 份时，`k-arch backfill/update` 应把同类全部收进同名子目录，并同步 `ARCHITECTURE.md` 链接；`check` 模式只报告不搬迁。

改目录结构时改本文件模板；已有项目需同步 `.kflow/reference/shared-paths.md`。
