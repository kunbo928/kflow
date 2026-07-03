# Compound 归档规则

`k-learn` / `k-trick` / `k-decide` / `k-explore` 共享本文件。

## 检索

动手前先搜 `.kflow/compound/`：

- 用 `doc_type` 过滤 learning / trick / decision / explore
- 命中只作输入，不盲目套用，可能已 `outdated`
- 命中冲突的 decision，必须说明为什么仍然这么做，或调整方向

完整命令见 `tools.md`。

## 守护规则

1. **只增不删**：除非被明确取代，否则不删旧文档
2. **宁缺毋滥**：用户说不出理由的节省略，不让 AI 编造
3. **实质内容可追溯**：来自用户或代码证据
4. **attention 检查**：写完后若有每次启动都该知道的一两行硬约束，提示用 `k-note` 追加
5. **起草前查重叠**：用 `search-yaml.py --query` 查语义相近旧文档
6. **识别更新意图**：用户说“改 / 更新 / 补充某条”时默认更新已有，不新建

## 重叠处理

查到旧文档后给用户三条路径：

- 更新已有：默认优先；保留原文件名和创建日期，frontmatter 补 `updated`
- supersede：旧文档保留，标 `status: superseded` + `superseded-by`
- 新建不同主题：新文档末尾列“相关文档”并说明区别

各子技能只认自己的 `doc_type`，不读写别家产物。
