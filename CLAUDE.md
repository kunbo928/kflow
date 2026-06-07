# kflow

面向严肃工程的 AI 编码工作流。编排软件生命周期（需求、架构、特性、缺陷、决策），人在环。

## 项目结构

```
k-*/                  # 25 个 kflow 技能（独立安装单元）
browser-bridge/       # 独立浏览器控制技能，不属于 kflow 体系
```

## 技能体系

26 个技能以 `k-` 为前缀，分属不同层级：

- **根入口**：`k-flow` — 路由到对应子技能，不做事
- **接入**：`k-onboard` — 在项目中生成 `.kflow/` 骨架
- **需求 & 架构**：`k-req`、`k-arch`
- **路线图**：`k-roadmap`
- **讨论入口**：`k-brainstorm`
- **特性流程**：`k-feat` → `k-feat-design` → `k-feat-impl` → `k-feat-accept`，轻量通道 `k-feat-ff`
- **问题流程**：`k-issue-report` → `k-issue-analyze` → `k-issue-fix`，入口 `k-issue`
- **重构流程**：`k-refactor`、`k-refactor-ff`
- **审计**：`k-audit`
- **知识沉淀**：`k-learn`、`k-trick`、`k-decide`
- **探索 & 文档**：`k-explore`、`k-guide`、`k-libdoc`
- **常驻提示**：`k-note`

## 硬约束

1. **技能隔离**：不同技能之间不要相互耦合，A 技能在非必须情况下不要看 B 技能。
2. **文件系统隔离**：skill 是独立安装单元，运行时每个 skill 只能看到自己包内的文件。A 技能的 SKILL.md 里写 `B-skill/reference/xxx.md` 在运行时根本读不到——skill 之间没有共享的文件系统父目录。
3. **跨技能共享**：必须走"工作项目"层——由 `k-onboard` 从技能包复制到项目的 `.kflow/reference/`，其他 skill 用项目相对路径 `.kflow/reference/xxx.md` 读取。
4. **修改共享口径**：改 `k-onboard/reference/` 下的模板，新项目 onboard 时带上新版本。
5. **单文档上限**：md 文件不超过 300 行，超过必须拆分。
6. **产物归属**：所有技能产物落在调用方项目的 `.kflow/` 下，不在本仓库内。

## 核心原则

言简意赅。增加、更新技能时注意更新其他相关技能中的表述。
