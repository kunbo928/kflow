---
name: k-onboard
description: 把新仓库或有零散文档的仓库接入 kflow 体系——两条路径自动判断：空仓库从零搭骨架，已有文档走审计 + 迁移映射——然后释放技能文件和跨平台入口（AGENTS.md / CLAUDE.md / .cursor/rules）。触发：用户说"在这个项目里用 kflow"、"搭 kflow 结构"、"初始化 kflow"、"迁移到 kflow"。
---

# k-onboard

把仓库**接入 kflow 工作流体系**——白纸或已有零散文档的都行。本技能做三件事：**搭骨架**、**归旧档**、**释放技能和跨平台入口文件**。骨架搭好后子工作流（feature / issue / compound 等）即可直接运行。

---

## 两条路径

| 路径 | 适用 | 产出 |
|---|---|---|
| **空仓库** | 仓库内无 spec 类文档，也没有 `..kflow/` | 完整骨架 + 必要骨架文件 |
| **迁移** | 仓库内有零散文档 / `docs/` / 部分 `..kflow/` 结构 | 审计报告 + 迁移映射方案（用户逐条确认）+ 落盘 |

启动后**先扫一次自动判断**，不要让用户选——TA 大概率不知道项目里现有哪些文档。扫描结果模糊（如只有 README）就明说判断依据并问用户。

---

## 标准骨架（目标状态）

> 共享路径与命名约定的权威版本是项目里的 `..kflow/reference/shared-conventions.md`——本技能从技能包复制过去。下面只列 onboard 创建 / 检查的骨架文件。

```
..kflow/
├── attention.md                kflow 技能启动必读的项目注意事项
├── requirements/               需求聚合根（空目录 .gitkeep）
├── architecture/
│   └── ARCHITECTURE.md         架构总入口（首次创建为占位模板）
├── roadmap/                    规划层聚合根
├── features/                   feature 聚合根
├── issues/                     issue 聚合根
├── compound/                   沉淀类统一目录（learning / trick / decision / explore）
├── skills/                     技能文件（onboard 从技能包释放，跨平台 AI 按需读取）
│   ├── k-flow/
│   ├── k-onboard/
│   ├── k-feat/
│   └── ...（全量 26 个或精简 7 个）
├── tools/                      跨工作流共享脚本（onboard 释放）
│   ├── search-yaml.py
│   └── validate-yaml.py
└── reference/                  跨子技能共享参考（onboard 释放）
    ├── shared-conventions.md
    ├── tools.md
    └── maintainer-notes.md
```


---

## 启动检查

**先检查一次现状**：

1. **检查 `..kflow/`**：不存在 → 空仓库候选；存在但不完整 → 迁移（部分补齐）
2. **旧 kflow兼容** kflow 经过多次改名，从 easysdd 到 .kflow 再到 ..kflow，如果遇到旧版的.kflow目录，提示用户：

   > 检测到旧版.kflow。建议直接 `git mv easysdd ..kflow`，结构 / frontmatter 完全兼容，rename 后即用。要我执行吗？

   同意 → `git mv easysdd ..kflow`，按迁移路径走（这时只需补齐可能缺失的 `attention.md`、`tools/` 和 `reference/`）。想保留旧目录 → 告诉他子技能只读 `..kflow/`，旧目录不会被读；按空仓库路径走新骨架

3. **Glob 全仓库 `.md`**（排除 `node_modules/` `.git/`）：根目录 `DESIGN.md` / `ARCHITECTURE.md` / `SPEC.md` / `README.md`；`docs/` `doc/` `design/` `spec/` `wiki/`；现有 `..kflow/` 下文件
4. **检测已有入口文件**：项目根目录 `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/kflow.mdc`，存在则记录（后面生成时逐条问用户）
5. **检查 `..kflow/attention.md`**：缺失则列为骨架待补齐项
6. **探测技能源**：往上找兄弟目录是否有 `k-flow/SKILL.md`（说明正在 kflow 源仓库里），找不到则问用户"kflow 技能源在哪？"
7. **汇报扫描结论**：找到的相关文档（列路径）+ 技能源路径 + 走哪条路径 + 判断依据 + 不确定项

---

## 空仓库路径

**步骤 1：和用户确认范围**

- 项目名 / 简介（用于填 `ARCHITECTURE.md` 占位）
- attention.md 只建最小骨架；用户已经给出的项目硬约束才写入，不凭空代填

**步骤 2：创建目录骨架**

按下面顺序执行，**不等用户逐步确认**——骨架是整体一次性的：

- `..kflow/{requirements,roadmap,features,issues,compound}/.gitkeep`
- `..kflow/attention.md`（最小骨架模板见同目录 `reference.md`）
- `..kflow/architecture/ARCHITECTURE.md`（占位模板见同目录 `reference.md`）
- `..kflow/tools/`（用 `cp -rf` / `Copy-Item -Recurse -Force` 整目录拷贝技能包 `k-onboard/tools/`，**不要 Read 再 Write**）
- `..kflow/reference/`（同上）

> **落盘用 shell 整目录覆盖**，不要 Read 再 Write——这两个目录是机器共享资产，Read+Write 会截断大文件、改缩进、吃空行，还慢费 token。具体命令见迁移路径步骤 4。

**步骤 3：释放技能文件**

1. `AskUserQuestion` 问技能规模：**全量 26 个** 还是 **精简 7 个**（`k-feat` `k-issue` `k-brainstorm` `k-refactor` `k-explore` `k-flow` `k-onboard`），默认全量
2. `cp -rf <技能源>/k-{所选技能}/ ..kflow/skills/`

精简包的 7 个覆盖日常 95% 场景，其他技能以后重跑 onboard 或手动补。

**步骤 4：生成跨平台入口文件**

1. 必选：`AGENTS.md`（模板见同目录 `reference.md` 第 3 节）——全平台 AI 都会读取
2. `AskUserQuestion`（multiSelect）问是否生成 `CLAUDE.md`（Claude Code）和 `.cursor/rules/kflow.mdc`（Cursor）
3. 遇到项目已有这些文件 → 逐条 `AskUserQuestion`：覆盖 / 追加到末尾 / 跳过

**步骤 5：attention.md 提醒**

attention.md 已创建但默认只有空骨架。汇报时提醒用户：有编译前置、测试命令、目录禁区、凭证规则这类"每次 kflow 技能启动都必须知道"的信息，后续用 `k-note` 一条条追加。

**步骤 6：验收汇报**

列建了哪些文件：

> kflow 骨架已就绪。现在可以：开始新功能 `k-feat` / 报告问题 `k-issue` / 沉淀知识 `k-learn`

---

## 迁移路径

**步骤 1：生成审计报告**

| 现有文件 | 推测内容类型 | 建议归入 kflow | 置信度 |
|---|---|---|---|
| `docs/DESIGN.md` | 项目架构 | `..kflow/architecture/ARCHITECTURE.md` | 高 |
| `docs/feature-auth.md` | 功能设计稿 | `..kflow/features/YYYY-MM-DD-auth/auth-design.md` | 中 |
| `SPEC.md` | 功能需求？ | 需用户确认 | 低 |

**置信度**：高 = 语义明确匹配；中 = 可推断有歧义；低 = 不明确或映射多个位置都合理。

**步骤 2：逐条对齐**

中 / 低置信度的用 `AskUserQuestion` 问：

- 中：给推断理由，问"按这个方式归位？"
- 低：描述文件内容，给 2-3 个候选位置 + "跳过"

高置信度不逐条问但要在汇报里列，给用户复审机会——逐条问会让节奏失控。

**步骤 3：处理已部分存在的 ..kflow/**

- 命名不符规范（`YYYY-MM-DD-{slug}` 格式）但有内容 → 提示用户问是否重命名
- 空占位（`.gitkeep` / 空 `.md`）→ 直接补齐不问

**步骤 4：补齐缺失骨架**

对照标准骨架补齐**用户确认后仍缺失**的目录 / 文件。已有内容不覆盖。

**`..kflow/tools/`、`..kflow/reference/`、`..kflow/skills/` 一律用技能包新版本覆盖**——这三个目录是技能包维护的共享资产，权威源在技能包，项目里的只是落盘副本。技能包升级后再跑 onboard 的目的之一就是刷新副本，留旧版本会让子技能按过时口径工作。

覆盖前在汇报列出被覆盖文件让用户知道；用户明确说"我改过 tools/xxx.py 请保留"才例外保留并标红。这是迁移路径**唯一强制覆盖**的动作，其他已有文件遵守"不经确认不动"。

**落盘命令**：

```bash
# macOS / Linux
cp -rf <技能源>/k-onboard/tools/.      ..kflow/tools/
cp -rf <技能源>/k-onboard/reference/.  ..kflow/reference/
cp -rf <技能源>/k-{所选技能}/          ..kflow/skills/

# Windows PowerShell
Copy-Item -Recurse -Force <技能源>\k-onboard\tools\*      ..kflow\tools\
Copy-Item -Recurse -Force <技能源>\k-onboard\reference\*  ..kflow\reference\
Copy-Item -Recurse -Force <技能源>\k-{所选技能}\*          ..kflow\skills\
```

不要：Read+Write 手工搬（截断 / 改缩进）、一个个 cp（多步骤多出错）、先比 diff（规则就是无条件覆盖）。

`<技能源>` 是启动检查步骤 6 确认的 kflow 技能所在目录。拷完 `ls ..kflow/tools/ ..kflow/reference/ ..kflow/skills/` 验证。

**步骤 5：生成跨平台入口文件**（同空仓库路径步骤 4）

**步骤 6：处理不迁移的文件**

用户选"跳过"的文件：**不移动 / 不删除 / 不重命名**，汇报标"保留原位（未纳入 kflow）"。**绝不允许未经确认就动**——onboard 只允许 AI 整理不允许替用户做删除决定。

**步骤 7：attention.md 提醒**（同空仓库路径步骤 5）

**步骤 8：验收汇报**

列：迁移文件清单（from → to）、新建骨架、未迁移文件（保留原位）、下一步建议。

---

## 骨架文件模板

`ARCHITECTURE.md` 占位模板、`attention.md` 最小模板、`AGENTS.md` 入口模板见同目录 `reference.md`。

---

## 退出条件

- [ ] `..kflow/` 九个子目录都存在（含 `skills/`）
- [ ] `..kflow/attention.md` 已建
- [ ] `..kflow/tools/`、`..kflow/reference/`、`..kflow/skills/` 已从技能包复制
- [ ] `..kflow/architecture/ARCHITECTURE.md` 已建
- [ ] `AGENTS.md` 已生成
- [ ] 迁移路径：每条映射都有明确处理结果（迁移 / 保留原位）
- [ ] 迁移路径：没有未经确认就移动的文件
- [ ] 验收汇报已给出

---

## 容易踩的坑

- **未经确认就移动 / 删除已有文件**——迁移核心原则是用户拍板
- **替用户填 attention.md 实质内容**——必须项目 owner 来定，AI 只提供模板
- **建完骨架立刻开始 feature/issue**——onboard 是"搭环境"不是"开始干活"
- **低置信度直接执行**——低 = 必须问
- **`..kflow/tools/` / `..kflow/reference/` / `..kflow/skills/` 走"不覆盖"保守策略**——这三个**必须**用技能包新版本覆盖，否则升级后用户停留在过时口径
- **用 Read + Write 手工搬**——必须 `cp -rf` / `Copy-Item -Recurse -Force` 整目录覆盖
- **Glob 时忘记排除 `node_modules/` `.git/`**——会让扫描结果充斥噪声
- **覆盖已有 AGENTS.md 不先问用户**——已有入口文件必须逐条确认

---

## 相关文档

- `..kflow/reference/system-overview.md` — kflow 体系总览
- `..kflow/reference/shared-conventions.md` — 目录结构和共享口径的权威版本
- `..kflow/attention.md` — kflow 技能启动必读的项目注意事项
- `..kflow/architecture/ARCHITECTURE.md` — 架构总入口骨架
