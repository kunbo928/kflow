# 共享 Frontmatter 口径

## Feature Spec

brainstorm / design / acceptance 共用：

- `doc_type`
- `feature`
- `status`
- `summary`
- `tags`

`status`：

- brainstorm：`confirmed`
- design：`draft` / `approved`
- acceptance：由 `k-feat-accept` 定义

## Issue Spec

report / analysis / fix-note 共用：

- `doc_type`
- `issue`
- `status`
- `tags`

`severity`、`root_cause_type`、`path` 由对应阶段按需补。

## Compound

learning / trick / decision / explore 统一写入 `.kflow/compound/`。

- 文件名：`YYYY-MM-DD-{doc_type}-{slug}.md`
- 顶部必须有 `doc_type`
- 子技能可追加自己的字段，如 `track` / `type` / `category`
- 各子技能只认自己的 `doc_type`，不读写别家产物

## 外部读者文档

guide / libdoc 的 frontmatter 由各自子技能定义。无特殊说明时：

- `draft`：待 review
- `current`：当前有效
- `outdated`：代码已变更待同步

子技能只写额外字段或阶段状态变化，不重复展开整套通用字段。
