# kflow 工具用法参考

本文件由 `k-onboard` 复制到项目的 `.kflow/reference/tools.md`，所有 kflow 子技能用项目相对路径 `.kflow/reference/tools.md` 引用。

kflow 的搜索和校验功能已内置到 CLI 命令中，不再依赖 `.kflow/tools/*.py` 脚本。

> **废弃通知**：`.kflow/tools/search-yaml.py` 和 `.kflow/tools/validate-yaml.py` 已被 `kflow search` 和 `kflow validate` 取代。Python 脚本保留在工具目录中仅供向后兼容，建议使用 CLI 命令。

---

## 1. kflow search

通用 YAML frontmatter 搜索工具。从项目根目录运行。

### 基本语法

```bash
kflow search --dir {目录} [--filter key=value]... [--query "全文关键词"] [--sort-by FIELD [--order asc|desc]] [--full] [--json]
```

### filter 语法

- `key=value`：字段精确匹配（大小写不敏感）
- `key~=value`：字符串字段子串匹配；列表字段元素包含匹配
- `key=a|b|c` / `key~=a|b|c`：同一字段多个候选值，候选之间是 OR；在 PowerShell / Bash 中请给整个 filter 加引号，例如 `--filter "doc_type=decision|explore|learning"`

### 排序语法

- `--sort-by FIELD`：按 frontmatter 字段排序（典型字段：`last_reviewed`、`date`、`updated_at`）
- `--order desc|asc`：`desc` 默认，新的在前；`asc` 老的在前（查"谁最久没更新"用这个）
- 字段缺失 / 值为空的文档一律排到最后，不干扰前排结论

### 常用命令

沉淀类文档统一在 `.kflow/compound/`，用 `doc_type` 字段区分四个子技能的产物，内部还有各自的细分字段：

```bash
# 按 doc_type 筛选
kflow search --dir .kflow/compound --filter doc_type=learning
kflow search --dir .kflow/compound --filter "doc_type=decision|explore|learning" --filter status=active
kflow search --dir .kflow/compound --filter doc_type=decision --filter status=active
kflow search --dir .kflow/compound --filter doc_type=trick --filter status=active
kflow search --dir .kflow/compound --filter doc_type=explore --filter status=active

# doc_type + 子技能内部细分字段
kflow search --dir .kflow/compound --filter doc_type=learning --filter track=pitfall
kflow search --dir .kflow/compound --filter doc_type=decision --filter category=constraint
kflow search --dir .kflow/compound --filter doc_type=trick --filter type=pattern
kflow search --dir .kflow/compound --filter doc_type=explore --filter type=question

# 按 tag（列表元素包含匹配）
kflow search --dir .kflow/compound --filter tags~=prisma

# 全文搜索
kflow search --dir .kflow/compound --query "shadow database"

# 按领域/框架/语言筛选
kflow search --dir .kflow/compound --filter doc_type=decision --filter area=frontend
kflow search --dir .kflow/compound --filter doc_type=trick --filter framework~=vue
kflow search --dir .kflow/compound --filter doc_type=trick --filter language=typescript

# 搜索 feature 方案 doc
kflow search --dir .kflow/features --filter doc_type=feature-design --filter status=approved

# 输出控制
kflow search --dir .kflow/compound --filter doc_type=decision --filter status=active --full
kflow search --dir .kflow/compound --filter tags~=llm --json

# 按时间排序
kflow search --dir .kflow/compound --sort-by date --order desc                     # 最近归档的在前
kflow search --dir .kflow/library-docs --sort-by last_reviewed --order asc         # 最久没 review 的在前（找陈旧文档）
kflow search --dir .kflow/guides --filter status=current --sort-by last_reviewed --order asc
```

### 典型使用场景

| 场景 | 命令建议 |
|---|---|
| feature-design 开始前查已有归档 | 搜 `.kflow/compound` 目录，按 `--query "{关键词}"` 全文搜；要分类看就加 `--filter "doc_type=learning\|trick\|decision\|explore"` |
| issue-analyze 根因分析前查历史 | 搜 `.kflow/compound` `--filter doc_type=learning --filter track=pitfall`、再搜 `--filter doc_type=trick --filter type=library`，按相关组件/框架过滤 |
| 归档落盘后查重叠 | 搜 `.kflow/compound --query "{关键词}" --json`，看有无语义重叠 |
| 新人了解项目规约 | `--dir .kflow/compound --filter doc_type=decision --filter status=active` |
| 按技术栈浏览技巧 | `--dir .kflow/compound --filter doc_type=trick --filter language={语言} --filter status=active` |
| 找最久没 review 的库文档 / 指南 | `--dir {目录} --filter status=current --sort-by last_reviewed --order asc` |
| 看最近沉淀了哪些经验 | `--dir .kflow/compound --filter doc_type=learning --sort-by date --order desc` |

---

## 2. kflow validate

YAML 语法校验工具。用于验证 frontmatter 语法和必填字段。

```bash
# 校验单个文件的 YAML 语法（纯 YAML）
kflow validate --file {文件路径} --yaml-only

# 校验必填字段
kflow validate --file {文件路径} --require doc_type --require status

# 批量校验目录下所有文件
kflow validate --dir {目录} --require doc_type --require status

# JSON 输出
kflow validate --dir {目录} --json
```
