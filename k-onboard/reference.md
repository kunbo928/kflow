# onboard 参考模板

本文件提供 `k-onboard` 使用的骨架模板。

## 1. `..kflow/architecture/ARCHITECTURE.md` 占位模板

```markdown
# {项目名} 架构总入口

> 状态：骨架（待填充）
> 创建日期：YYYY-MM-DD

## 1. 项目简介

## 2. 核心概念 / 术语表

## 3. 子系统 / 模块索引

## 4. 关键架构决定

## 5. 已知约束 / 硬边界
```

## 2. `..kflow/attention.md` 最小模板

attention.md 是 kflow 技能启动必读的项目注意事项入口。onboard 创建最小骨架，不替项目 owner 填实质内容；后续短规则由 `k-note` 追加。

```markdown
# Attention

本文件是 kflow 技能启动必读的项目注意事项入口。所有 kflow 子技能开始工作前必须读取它。

## 项目碎片知识

<!-- k-note managed: 用 k-note 维护，新条目按下面分节追加 -->

### 编译与构建

### 运行与本地起服务

### 测试

### 命令与脚本陷阱

### 路径与目录约定

### 环境变量与凭证

### 其他
```

## 3. `AGENTS.md` 跨平台入口模板

`AGENTS.md` 是 k-onboard 在目标项目生成的全平台通用入口文件。Cursor/Codex/OpenCode/Claude Code 都会在会话启动时读取它。

```markdown
# AGENTS

本项目已接入 kflow 工作流体系。

## 启动规则

**每次对话开始，先 `Read .kflow/attention.md`，再开始任何工作。**

如果 `.kflow/` 目录不存在，先执行 `.kflow/skills/k-onboard/SKILL.md` 中的 onboard 流程。

## 场景路由

| 你想做什么 | 读取技能文件 |
|-----------|-------------|
| 不知道走哪个/了解体系 | `.kflow/skills/k-flow/SKILL.md` |
| 新功能 / 实现需求 | `.kflow/skills/k-feat/SKILL.md` |
| 修 bug / 异常 / 报错 | `.kflow/skills/k-issue/SKILL.md` |
| 想法还模糊想先聊 | `.kflow/skills/k-brainstorm/SKILL.md` |
| 重构 / 代码优化 | `.kflow/skills/k-refactor/SKILL.md` |
| 摸代码 / 了解实现 | `.kflow/skills/k-explore/SKILL.md` |
| 搭 kflow / 初始化 | `.kflow/skills/k-onboard/SKILL.md` |

其他场景（技术决策、经验沉淀、审计等）的完整路由表见 `.kflow/skills/k-flow/SKILL.md`。

## 工具映射

技能文件中使用的工具名为 Claude Code 命名（`Read`/`Write`/`Edit`/`Bash`/`Glob`/`Grep`），请映射到你当前平台的等价工具。
```

## 4. `CLAUDE.md` Claude Code 入口模板

与 `AGENTS.md` 内容一致，但以 Claude Code 技能触发方式表述。

```markdown
# CLAUDE

本项目已接入 kflow 工作流体系。

## 启动规则

**每次对话开始，先 `Read .kflow/attention.md`，再开始任何工作。**

如果 `.kflow/` 目录不存在，先触发 `k-onboard` 技能。

## 场景路由

| 你想做什么 | 触发技能 |
|-----------|---------|
| 不知道走哪个/了解体系 | `k-flow` |
| 新功能 / 实现需求 | `k-feat` |
| 修 bug / 异常 / 报错 | `k-issue` |
| 想法还模糊想先聊 | `k-brainstorm` |
| 重构 / 代码优化 | `k-refactor` |
| 摸代码 / 了解实现 | `k-explore` |
| 搭 kflow / 初始化 | `k-onboard` |

其他场景完整路由表：触发 `k-flow` 技能。
```

## 5. `.cursor/rules/kflow.mdc` Cursor 入口模板

```markdown
---
description: kflow 工作流路由
globs: **/*
alwaysApply: true
---

本项目已接入 kflow 工作流体系。

## 启动规则

**每次对话开始，先读取 `.kflow/attention.md`，再开始任何工作。**

如果 `.kflow/` 目录不存在，先执行 `.kflow/skills/k-onboard/SKILL.md`。

## 场景路由

| 你想做什么 | 读取文件 |
|-----------|---------|
| 不知道走哪个 | `.kflow/skills/k-flow/SKILL.md` |
| 新功能 / 实现需求 | `.kflow/skills/k-feat/SKILL.md` |
| 修 bug / 异常 | `.kflow/skills/k-issue/SKILL.md` |
| 想法模糊想聊 | `.kflow/skills/k-brainstorm/SKILL.md` |
| 重构 / 代码优化 | `.kflow/skills/k-refactor/SKILL.md` |
| 摸代码 / 了解实现 | `.kflow/skills/k-explore/SKILL.md` |
| 搭 kflow / 初始化 | `.kflow/skills/k-onboard/SKILL.md` |

工具映射：技能文件用 Claude Code 工具名（Read/Write/Edit/Bash/Glob/Grep），映射到 Cursor 的等价工具。
```
