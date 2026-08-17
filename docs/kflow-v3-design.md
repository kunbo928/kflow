# kflow v3：项目地图与 Work

kflow 是一组跨平台工程 Skill，加一个确定性 CLI。Skill 负责语义判断；CLI 负责形状、非空和路径存在。不维护第二套软件生命周期数据库。

闭环：`项目地图 → 路由 → 拷问至 Spec Clear → 按切片 TDD → 审查 → 知识写回地图`。重构做已批准的结构改动。校准以代码为准修地图。

## 硬约束

1. `k-*` 不读取其它 `k-*` 包内文件，不建 `_shared`。允许正文点名；一处点名的手法进主人 `references/`，多处点名才独立成包。
2. 每个 Markdown（`SKILL.md` 与每一份 reference）各自 ≤300 行。
3. AI 入口只有根 `AGENTS.md` 与 project-map。不建 `lessons/`、`attention.md`、平行需求/架构库。任务契约只在 `.kflow/works/*/spec.md`。

本仓库 `.agents/skills/` 是开发 kflow 时用的拷贝，不随 `kflow init` 走。调用方只装产品 `k-*`。

## 项目上下文

给 AI 持续维护的只有两份：

| 内容 | 写到哪 |
| --- | --- |
| 怎么干活：验证命令、协作规则、何时读地图 | 根 `AGENTS.md`（始终加载） |
| 项目是什么：边界、区域、指针、校验方式、区域短介绍 | `.kflow/project-map/` |

```text
project-map/
├── index.md
├── development.md       # 按需
├── architecture.md      # 按需
└── areas/               # 按需
```

非平凡任务先读 `index.md`，再按指针渐进加载。地图条目指向正式事实归宿并说明校验方式，不复制文件树、API、版本或进度。区域短介绍只做定向：这个区干什么、入口路径、一个关键约定或坑。不是需求或方案。

能从代码、测试、`package.json` 查到的不抄。当前任务的需求、验收、方案只在 Work spec。

校准：代码或命令已经变了，以代码为准修指针、边界、校验方式，不写新介绍。收尾写回补下一轮还用的介绍或规则。同一句打架，校准赢。

`init` 在根 `AGENTS.md` 不存在时写最小版本；已有文件只增加有边界的 kflow 区块。冲突交 owner。

## Work

每项有边界的工作一个目录。**唯一的是 Work，不是 Skill。** 全程至多一个 `works/{type}-{slug}/`；步骤 Skill 可以接力。禁止两份 spec。

```text
.kflow/works/
├── roadmap-payment-migration/
│   ├── spec.md
│   ├── work.md
│   └── feats/
│       ├── 01-payment-adapter.md
│       └── 02-cutover.md
├── feat-csv-export/
├── issue-login-redirect/
├── refactor-cache-boundary/
├── research-agent-context/
└── prototype-editor-flow/
```

`spec.md` 是稳定契约与最终结果。`work.md` 是活动状态、下一步、证据、未解决 finding。下一跳从磁盘读这两份；已确认契约不准再问。不另建交接文件。完成后不自动删除 `work.md`；Agent 只报告是否可删，用户决定。

目录名 `{type}-{slug}`。类型：`roadmap`、`feat`、`issue`、`refactor`、`research`、`prototype`。没有 `architecture`。`k-implement` / `k-review` / `k-knowledge` / `k-grilling` / `k-author` 不新建类型。

### Roadmap

`spec.md` 保存目的地、范围、非目标、决策、迷雾、Feature 索引/依赖和整体验收。子项为 `feats/NN-name.md`。编号是展示顺序；`id` + `depends_on` 才是依赖。子 Feature 不再建平行 `feat-*` Work。

路线级拷问只处理目的地和迷雾。每个子 Feature 与独立 feat 同一条链：Spec Clear → implement → review → knowledge。进入执行前，路线级迷雾必须清空。

## 生命周期

状态：`proposed → active → accepted`，必要时 `blocked`、`cancelled`、`superseded`。

1. **路由**：`k-flow` 读地图、调查仓库，选定 Work 类型和当前步骤。入口不建半成品 spec。
2. **Spec Clear**：行为、范围、验收、测试接缝、归属或取舍未齐时，Work 主人点名 `k-grilling`。已清则零提问。契约写在 `spec.md`（子项写在 `feats/NN.md`）：验收场景 + 测试契约（接缝与探针）。澄清阶段不写完整测试文件。
3. **实现**：点名 `k-implement`。按测试契约一次一个 tracer bullet：先 red 再实现再 green。契约没有可重复红信号则退回主人。Feature 目标行为 `red → green`；Issue 同一故障症状 `red → green`（诊断 ≠ 修复授权；诊断折进 `k-issue/references/`）；Refactor 可观察基线 `green → green`。
4. **审查**：实施后点名 `k-review`。实施者只能自审预检。最终批准者必须独立于实施者（可以是另一个 Agent；人不必须在环上）。审查前记下 git base + head；结论只对这一对有效，head 再变则旧结论 stale。Spec 与 Standards 在隔离子代理中进行，一轴通过不能抵消另一轴阻塞项。blocking / important 挡住 `accepted`；nit 永不挡。小改动可降深度，不可取消终审、不可作者自批。紧急且独立 reviewer 不可得时，仅 owner（人）可开 `risk_accepted`（理由、范围、补审责任）。
5. **写回**：点名 `k-knowledge`（写法点名 `k-author`）。收尾必扫；用户可随时「记住」。验收不进地图。
6. **毕业**：`spec.md` 记录实现、验证、审查、写回。Agent 报告 `work.md` 是否可删。

## Skill 拓扑

`k-flow` 先定工作类型，再指出当前步骤：

| 诉求 | 当前步骤 | Work 主人 |
| --- | --- | --- |
| 地图缺失或未核实骨架 | `k-onboard` | 无 |
| 大需求 | `k-roadmap` | `roadmap-*` |
| 小需求 / 可观察行为 | `k-feat`（澄清） | `feat-*` 或子 Feature |
| 故障 | `k-issue` | `issue-*` |
| 已批准的行为等价重构 | `k-refactor` | `refactor-*` |
| 只调研 | `k-research` | `research-*` |
| 可丢弃产物回答一个决策 | `k-prototype` | `prototype-*` |
| 以代码为准修地图 | `k-reconcile` | 通常无 |
| 已有 spec，按切片实现 | `k-implement` | 不新建 |
| 实施后的门禁 | `k-review` | 不新建 |
| 记住 / 收尾写回 | `k-knowledge` | 不新建 |
| 拷问 | `k-grilling` | 不新建 |
| 写 AGENTS.md / 地图 / Skill | `k-author` | 不新建 |

TDD 在 `k-implement/references/`。双轴手法在 `k-review/references/`。领域词在 `k-grilling/references/`。方案讨论折进 roadmap/refactor 的拷问，不设 architecture Work。

Research、Prototype 可以是独立 Work，也可以是既有 Roadmap 的内部资产。Reconcile 通常直接改地图，只有确需跨会话恢复时才建 Work。

## CLI 边界

CLI 强制形状、非空、路径存在。`--json` 输出版本化 envelope（`schemaVersion`、`ok`、`diagnostics[]`）。只读派生投影（如 roadmap 的 frontier / blocked / next）属形状范畴，不算语义判断。不跑测试、不判拷问、不评 finding 对错、不核验「reviewer 是不是实施者」。

```text
kflow init
kflow doctor
kflow status
kflow map validate
kflow work create <roadmap|feat|issue|refactor|research|prototype> <slug>
kflow work show <type-slug|path>
kflow work validate <type-slug|path>
kflow document search|validate
```

- `init`：建 `works/` 与 `project-map/index.md`；缺则写最小 `AGENTS.md`；安装产品 `k-*`（含 implement / grilling / author）。不建 `lessons/`、`attention.md`。
- `doctor`：查上述资产与每个产品 Skill 的 `SKILL.md`、`references/`；校验全部 Work。遗留 `lessons/`、`attention.md` 只报告不失败。`--fix` 不得重建它们。
- `work show`：对 roadmap 只读派生 `frontier` / `blocked` / `next`（`depends_on` 全部 accepted 的 proposed feat；同层按 feat 文件名顺序）。「下一步」在 `nextStep`，与投影 `next` 分开。
- `work validate`：`active`/`accepted` 时 Spec Clear 章节必须有正文。`accepted` 时「验证证据」与「交付结果」四小节非空；审查节含 base/head，终态为 `review_passed` 或 `risk_accepted`，且无未勾掉的 blocking/important 标记。
- `map validate`：`index.md` 有「项目边界」「上下文路由」；路由表里的仓库相对路径必须存在。不跑校验命令。
- `document *`：通用 frontmatter 工具，不是闭环步骤。无 `--skill`。

旧 `.kflow/cursors/` 等只作 legacy 报告，不自动迁移或删除。
