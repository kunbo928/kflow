<div align="center">

# kflow

**面向严肃工程的 AI 编码工作流。编排软件生命周期，人在环。**

<p>
  <img src="https://img.shields.io/badge/status-beta-F59E0B?style=flat-square" alt="Status"/>
  <img src="https://img.shields.io/badge/skills-25-6366F1?style=flat-square" alt="Skills"/>
  <img src="https://img.shields.io/badge/license-MIT-10B981?style=flat-square" alt="License"/>
</p>

</div>

---

## 安装

在**目标项目**根目录执行（[skills CLI](https://github.com/vercel-labs/skills)）：

```bash
npx skills add kunbo928/kflow
```

交互提示选择 Agent 时选 **Claude Code**。非交互一步到位：

```bash
npx skills add kunbo928/kflow -a claude-code --skill '*' -y
```

装完后**新开 Claude Code 会话**：

```bash
/k-onboard    # 首次：生成 .kflow/ 骨架
/k-flow       # 日常：路由到正确的子技能
```

<details>
<summary>Cursor / Codex</summary>

```bash
npx skills add kunbo928/kflow -a cursor --skill '*' -y
npx skills add kunbo928/kflow -a codex --skill '*' -y
```

技能在 `.agents/skills/`。无 `/` 斜杠——对话里说 **「k-onboard」** / **「k-flow」**，或 `@k-flow`。

</details>

<details>
<summary>更多选项</summary>

```bash
npx skills add kunbo928/kflow --list       # 查看技能列表
npx skills add kunbo928/kflow -g           # 全局安装（跨项目可用）
npx skills add .                           # 本地开发 kflow 源码时
```

</details>

---

## 技能总览

25 个技能按软件活动分组，覆盖完整开发闭环。

| 分组 | 技能 | 用途 |
|------|------|------|
| **根入口** | `k-flow` | 统一入口，介绍体系 + 路由到对应子技能 |
| **接入** | `k-onboard` | 生成 `.kflow/` 骨架，释放参考文档 |
| **长效档案** | `k-req` `k-arch` | 需求文档 / 架构文档（只记现状） |
| **路线图** | `k-roadmap` | 大需求的事前规划：模块拆分 → 接口契约 → 子 feature 清单 |
| **讨论** | `k-brainstorm` | 模糊想法的分诊入口，路由到 design / roadmap / 直接开写 |
| **特性流程** | `k-feat` → `k-feat-design` → `k-feat-impl` → `k-feat-accept`<br>`k-feat-ff`（轻量通道，跳过 design） | 想清楚 → 设计 → 编码 → 验收 |
| **问题流程** | `k-issue` → `k-issue-report` → `k-issue-analyze` → `k-issue-fix` | 报告 → 分析根因 → 定点修复 |
| **重构流程** | `k-refactor` `k-refactor-ff` | 重构主流程 / 轻量通道（beta） |
| **审计** | `k-audit` | 代码质量审计 |
| **知识沉淀** | `k-learn` `k-trick` `k-decide` | 踩坑记录 / 可复用技巧 / 技术决策 |
| **探索 & 文档** | `k-explore` `k-guide` `k-libdoc` | 定向代码探索 / 开发者指南 / 库参考 |
| **常驻提示** | `k-note` | 会话级常驻上下文 |

---

## 工作流示意

kflow 不是线性流水线，而是**分层 + 事件驱动**：

```
══════════════════════════════════════════════════════════════
 根入口 · k-flow                     （任何时候都可调用）
──────────────────────────────────────────────────────────────
   介绍体系 / 把开放式诉求路由到对应子技能
══════════════════════════════════════════════════════════════
                            │
    ┌───────────────┬───────┴───────┬───────────────┐
    ▼               ▼               ▼               ▼
══════════════════ ════════════════ ════════════════ ═══════
 第 1 层              第 2 层           第 3 层          横切层
 长效档案             规划              执行流程          知识沉淀
──────────────────────────────────────────────────────────────
 k-req  需求文档     k-roadmap        k-feat-*  特性    k-learn
 k-arch 架构文档     路线图拆解        k-issue-* 问题    k-trick
                    （大需求才进）     k-refactor 重构   k-decide
                                       k-audit   审计    k-explore
──────────────────────────────────────────────────────────────
                            │
                    k-brainstorm（讨论入口 · 可选）
                    模糊想法分诊后路由到上面各层
══════════════════════════════════════════════════════════════
```

**怎么读：**
- **纵向分层**，不是严格时序——长效档案持续刷新，规划层只在大需求时进入
- **第 3 层是事件入口**：新需求走 feature 流，bug 走 issue 流，腐化走 refactor 流
- **横切层是复利飞轮**：任何流程跑完觉得"值得记下来"就触发沉淀，产物被下一次同类工作读到

---

## 6 个实体 · 3 个流程

kflow 把软件活动建模成 6 个实体，走 3 条流程。实体回答"项目里有什么"，流程回答"怎么推动它演进"：

- **实体**：需求（为什么要有）· 架构（用什么结构实现）· 路线图（接下来怎么走）· 特性（新增能力）· 问题（修复缺陷）· 知识（复利沉淀）
- **流程**：特性引入（design → impl → accept）· 问题修改（report → analyze → fix）· 代码重构（scan → design → apply）

<details>
<summary>运行时结构：.kflow/ 目录</summary>

`/k-onboard` 在项目根生成 `.kflow/`，所有产物聚合于此：

```
.kflow/
├── requirements/          # 需求文档
├── architecture/          # 架构文档（总入口 + 子系统）
├── roadmap/               # 路线图（主文档 + items.yaml + 草稿）
├── features/              # 特性流程（design / checklist / acceptance）
├── issues/                # 问题流程（report / analysis / fix-note）
├── refactors/             # 重构流程（beta）
├── compound/              # 知识沉淀（learning / trick / decision / explore）
├── skills/ tools/ reference/   # onboard 释放，跨平台 AI 读取
```

**要点：**
- `requirements/` `architecture/` 是**长效档案**（只记现状），`roadmap/` 是**规划层**，刻意分开
- `features/` `issues/` `refactors/` 用 `YYYY-MM-DD-{slug}/` 一个目录装齐所有相关产物
- `compound/` 是唯一的知识沉淀目录，按 `doc_type` 区分而非分目录——好搜
- `reference/` 是跨 skill 共享口径，改 `k-onboard/reference/` 模板，新项目 onboard 自动带上新版

</details>

---

## 设计哲学

### 缘起

日常用 AI 编码工具时发现一个共同问题：没有流程约束，面对复杂工程不知道该用哪个技能、什么时候用。调研了同类工具：

- **OpenSpec** — 太简单，无复利工程，生成的 Spec 人类没法读
- **SuperPowers** — 没有流程约束，不知道该用哪个
- **Oh-My-OpenAgent** — 太重，且哲学上认为「人介入 = 失败」

kflow 的目标是**解决严肃工程的软件实现和编码问题**，不是造新名词、追热点。

### 核心区别：编排的目标是谁

主流 AI 编码框架（Superpowers、CCW、Oh-My-OpenAgent 等）在做**同一件事**：

> **如何把 Agent 编排得更好。** 组队、协作、流水线、自动接力。围绕的实体始终是 **Agent**。

kflow 走**另一个方向**：

> **编排的不是 Agent，而是软件本身的生命周期。** 围绕的实体是**构成软件的要素**——需求、架构决定、特性、bug、历史约束。

| | Agent 编排派 | kflow |
|---|---|---|
| **核心实体** | Agent / Role / Team | Requirement / Architecture / Feature / Issue / Decision |
| **主线问题** | Agent 之间怎么分工、传递、协调？ | 软件的需求、约束、决策怎么被记下来、检索、复用？ |
| **状态存在哪** | Agent 的 session / 消息总线 / 队列 | 项目 `.kflow/` 文件树（人和 AI 都能读） |
| **解决的痛点** | 单 Agent 能力不够，需要协同放大 | 软件复杂度撑破上下文、隐知识丢失、需求漂移 |
| **对人的定位** | 人少介入越好，理想是全自动 | 人在环——程序员对整体把控负责，AI 是高效的执行体 |

**这两个方向没有对错。** 如果你的任务是「用 AI 跑端到端自动化产线」，Agent 编排派更顺手。如果你的任务是「维护跨年迭代的严肃软件」「让今天写下的决策三个月后还能被准确召回」——kflow 这套以软件要素为中心的建模更合适。

我做 kflow 是因为我相信：**软件工程的混乱本质上不是 Agent 不够强，而是要素没被组织好**。Agent 再强，也写不了一个把需求、架构、历史决策全丢失的项目。

### 价值观

- **人在环** — 程序员是软件编码中的在环对象，对整体把控负责，必要时可深入。这与 OMO「人介入 = 失败」的哲学完全相反
- **可演进** — 软件架构必须可观测、可控制、可演进。AI 发展强大后这一点可能不再重要，但**当下这样做能让程序员舒服**——这就是价值
- **服务于人** — 现有大部分框架围绕 AI 建模，而不是围绕人。kflow 认为这些框架的作者驱动 AI 的能力很强，但不是严肃软件的开发者——缺少对需求和设计的基础组织能力，缺乏对代码实现的尊重

---
