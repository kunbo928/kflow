# kflow 共享口径索引

由 `k-onboard` 复制到项目的 `.kflow/reference/`。本文件只做路由索引，避免每个技能启动时读完整共享规范。

## 加载规则

默认只读本文件 + `.kflow/attention.md`。需要具体规则时只打开对应小文件：

| 需要什么 | 读取 |
|---|---|
| 路径、目录结构、命名 | `shared-paths.md` |
| frontmatter / status 字段 | `shared-frontmatter.md` |
| feature checklist 生命周期 | `shared-checklist.md` |
| roadmap 和 feature 状态衔接 | `shared-roadmap-feature.md` |
| 阶段收尾推荐、scoped commit | `shared-closeout.md` |
| compound 归档检索 / 查重 / supersede | `shared-archive.md` |
| 写代码时的反射检查 | `shared-reflection.md` |
| TDD / 回归 / 集成测试口径 | `shared-testing.md` |
| 共享工具命令 | `tools.md` |

## 兼容旧引用

旧文档里若还写“`shared-conventions.md` 第 X 节”，按下面映射读取：

- 第 0 节 → `shared-paths.md`
- 第 1 节 → `shared-frontmatter.md`
- 第 2 节 → `shared-checklist.md`
- 第 2.5 节 → `shared-roadmap-feature.md`
- 第 3 / 4 节 → `shared-closeout.md`
- 第 5 / 6 节 → `shared-archive.md`
- 第 7 节 → `shared-reflection.md`
- 第 8 节 → `shared-testing.md`

## 原则

- 先索引，后正文；先路由，后深读。
- 没有命中具体需求，不打开大模板 / 示例 / 历史正文。
- 子技能正文只写本阶段特有规则，共享规则放上面的小文件。
