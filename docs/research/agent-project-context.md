# AI Agent 协同开发中的项目上下文

## 结论

项目上下文不应全部塞进 `AGENTS.md`，也不应由一份自动生成的文档复制源码事实。更稳妥的结构是：

- `AGENTS.md` 是始终生效的协作契约：项目级约束、构建与验证命令、安全边界，以及何时读取其他上下文。
- Project Map 是版本化的轻量导航：项目目标、模块边界、关键入口、事实 owner 和当前工作入口；以链接指向源码、manifest、README、ADR 等 canonical owner。
- 局部 `AGENTS.md` 只放目录范围内的差异规则；任务方法放按需加载的 Skill；Roadmap、Spec 等长周期状态放独立 living document。
- 首次 onboarding 只生成可用骨架；Feature、Issue 和 Refactor 在发现有效新事实或漂移时增量更新；定期校准以代码及其 canonical owner 为准。

这不是某个工具独有的文件布局，而是从多个开源 Agent 系统共同采用的“稳定的始终加载层 + 有作用域的局部层 + 按需展开层”归纳出的设计。

## 一手实践对比

| 实践 | 始终加载的内容 | 细节如何展开 | 新鲜度机制 | 对 kflow 的启示 |
| --- | --- | --- | --- | --- |
| AGENTS.md / OpenAI Codex | 项目说明、命令、风格、测试、安全等 Agent 指令 | 可在子目录放置 `AGENTS.md`；最近作用域优先 | 作为代码库内 living documentation 评审和维护 | 用它约束行为和上下文入口，不复制全量架构 |
| Agent Skills | 启动时仅暴露 Skill 的名称与描述 | 命中任务后加载 `SKILL.md`，再按明确指针读取 references/scripts/assets | 内容随仓库版本化；小而聚焦的文件降低错误触发和陈旧上下文影响 | Research、Prototype、Grilling、TDD 应是按需能力 |
| Claude Code | `CLAUDE.md` 放每次会话都需要的广泛事实和命令 | 嵌套文件、imports 和 Skills 提供局部或任务上下文 | `/init` 生成起点，随后像代码一样评审、持续精炼和定期删旧内容 | Onboard 建骨架，执行流程负责增量反馈 |
| Gemini CLI | 全局、项目、父目录及局部 `GEMINI.md` 构成分层上下文 | `@file.md` 可模块化，局部文件随作用域加载 | `/memory show/list/refresh` 可检查及重新载入实际上下文 | 应能检查地图来源并显式刷新，而非相信缓存 |
| GitHub Copilot | 仓库级 instructions 或跨 Agent 的 `AGENTS.md` | path-specific instructions、prompt files 和 Skills 分离作用域与任务 | 指令版本化；按文件路径选择适用内容 | 全局规则、目录规则、任务流程应分层拥有 |
| aider Repo Map | 在 token 预算内提供仓库关键符号与关系摘要 | 根据依赖图排名，只展示相关部分，再按需打开源码 | 从当前源码与 Tree-sitter 分析动态生成 | 机器可推导的代码结构不必手工复制进 Project Map |
| Backstage Catalog | 目录展示组件、owner 与关系 | catalog 实体引用仓库内描述文件和其他实体 | Git 中近代码的 descriptor 是事实源，catalog 是可重建视图；owner 按常规 Git 流程维护 | 地图应是索引/视图，事实仍归源码和既有 owner |

## 关键边界

### `AGENTS.md` 是协作契约，不是项目百科

[AGENTS.md 开放规范](https://agents.md/)将它描述为“给 Agent 的 README”，推荐项目概览、环境命令、代码风格、测试、安全和 PR 规则；大型仓库可用嵌套文件表达子项目差异，最近的文件优先。[OpenAI Codex 的基础指令](https://github.com/openai/codex/blob/main/codex-rs/protocol/src/prompts/base_instructions/default.md)进一步明确：文件作用域是其所在目录树，较深层规则覆盖冲突的上层规则。

因此，根 `AGENTS.md` 应包含每次协作都必须知道、且足够稳定的内容，并用一句明确规则指向 Project Map。模块细节放局部 owner；把文件清单、完整依赖图或临时 Roadmap 放进根文件，会扩大每次会话的固定上下文并增加漂移面。

### Project Map 应是薄索引，不是第二事实系统

[C4 Model](https://c4model.com/introduction)用可缩放的 system context、container、component 和 code 层级表达“代码地图”，目的包括沟通、onboarding、架构评审与风险识别。它说明地图需要抽象层级，但不要求把实现细节复制进一张图。

[aider 的 Repo Map](https://aider.chat/2023/10/22/repomap.html)则从当前源码抽取符号与引用关系，并按依赖图和 token 预算筛选最相关片段。这提示机器能便宜重建的文件树、符号表和依赖关系应动态获取；人工维护的 Project Map 应保存目的、边界、入口和“去哪里查”的信息。

[Backstage Software Catalog](https://backstage.io/docs/features/software-catalog/)把仓库内、靠近代码的 metadata 文件作为组件事实源，并由 owner 通过日常 Git 流程维护；catalog 是汇总视图。其[目录图指南](https://backstage.io/docs/features/software-catalog/creating-the-catalog-graph/)还明确建议把 catalog 当缓存而非终极事实源，并提醒自动分类适合生成初稿，准确性仍需 owner 治理。对 kflow 而言，Project Map 同样不应夺走 manifest、README、ADR、测试或源码的所有权。

### 渐进披露比一次性注入完整上下文可靠

[Agent Skills 规范](https://agentskills.io/specification)将详细 reference 拆到独立文件并按需加载；[实现指南](https://agentskills.io/client-implementation/adding-skills-support)定义三层披露：启动时的名称/描述、激活后的 `SKILL.md`、执行时才加载的资源。官方[最佳实践](https://agentskills.io/skill-creation/best-practices)强调核心说明保持精简，并写清何时读取哪份 reference。

[GitHub Copilot 官方说明](https://docs.github.com/en/copilot/concepts/agents/code-review)也区分仓库级规则、路径规则、跨 Agent 的 `AGENTS.md` 与按需 Skill。[Gemini CLI](https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html)采用全局、项目和局部上下文层级，并提供 imports；`/memory show`、`list`、`refresh` 让用户检查并刷新实际加载内容。共同原则是：索引先出现，任务相关细节后加载。

### Onboarding 是起点，漂移治理必须进入日常闭环

[Claude Code 最佳实践](https://code.claude.com/docs/en/best-practices)建议用 `/init` 扫描构建系统、测试框架和代码模式生成初始 `CLAUDE.md`，随后持续精炼、像代码一样评审并定期删掉陈旧内容；频繁变化的信息不适合放在始终加载的说明里。[Claude Code memory 文档](https://code.claude.com/docs/en/memory)还支持分层文件和 imports，但被导入内容仍会占用上下文，因此“拆文件”本身不等于按需加载。

由此推导，kflow 不能把首次扫描结果视为永久真相。地图维护应采用事件驱动加周期校准：任务只更新本次已验证的触点；架构或 owner 变化时同步指针；定期由 Refactor 对照代码、测试、manifest 和 canonical docs 检查漂移。

## 对 kflow 的建议结构

### 1. 根 `AGENTS.md`

保留：

- 项目性质、不可违反的工程约束和安全边界；
- 真实可运行的 build、test、lint 命令；
- 文档/代码事实的 ownership 规则；
- 一条 Project Map 加载规则，例如“开始非平凡任务时先读地图，再按其中指针读取相关 owner”；
- 何时需要把新发现回流到地图或局部 `AGENTS.md`。

不放：完整目录树、逐文件说明、当前任务进度、复制的 API/依赖版本、详细研发流程。

### 2. Project Map

建议作为独立、短小、版本化的 Markdown，内容限定为：

- 项目目的与系统边界；
- 主要模块/能力及其 owner 指针；
- 关键开发入口和命令 owner；
- 架构、规范、领域词汇、Roadmap、风险和知识记录的入口；
- 每项的验证依据或最后校准信息，但不复制 owner 正文。

这份地图是“上下文路由表”。若信息能从源码可靠重建，就不手工固化；若已有 canonical owner，就只链接并写一行用途。

### 3. 生命周期

1. 首次 `k-flow` 未发现有效地图时，路由 `k-onboard`：有界扫描并生成骨架，同时补齐必要的根 `AGENTS.md`。
2. `k-flow` 用地图获得低分辨率全貌，再按需求读取局部 owner，完成需求收敛与路由。
3. Feature、Issue 和 Roadmap 在结束时只提交已被代码、测试或用户决定验证的新事实与指针。
4. Refactor 提供“地图校准”模式：检测失效路径、命令、模块边界和重复事实；以代码与 canonical owner 为准修订地图，并把架构优化建议作为另一种明确模式处理。
5. Code Review 同时检查实现契约和上下文回流：只有存在稳定、可复用变化时才要求更新，避免每次任务制造无意义文档 churn。

## 设计判断

最适合 Q1 的答案不是“只用 `AGENTS.md`”或“再建一套项目文档”，而是两层组合：

- `AGENTS.md` 拥有跨 Agent 的协作规范和 Project Map 的加载/维护契约；
- Project Map 拥有项目全貌的低分辨率导航，但不拥有其链接到的事实。

这样既保证首次和跨会话协作有稳定上下文，也避免把 Project Map 变成与源码竞争的第二事实系统。
