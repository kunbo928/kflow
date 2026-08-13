---
name: k-review
description: 对冻结的 diff 或设计执行只读 Spec 与 Standards 双轴审查。
argument-hint: "[范围或目标]"
---

# k-review

只审查一个不可变目标并返回一份终态报告。本 Skill 只读且为叶子执行器：不修改产品或上下文文件，不创建子 Agent。

调用方提供意图、冻结的 diff/range/文档 hash、适用 Spec、项目地图指针、局部 `AGENTS.md`、排除范围和返回格式。信息不足时返回 `NeedsContext` 及缺失内容。

同时审查：

- **Spec**：实现和测试是否覆盖已接受的行为、边界与场景。
- **Standards**：归属、命名、模块深度、调用方、测试接缝和仓库规则是否仍然健康。

每个 finding 包含级别（blocking、important、nit）、文件与行号或设计章节、后果和可执行修正。存在 blocking 时不能通过。复审检查完整新目标和修复增量，将旧 finding 标记为 resolved 或 unresolved，同时报告新增 finding。

完整审查会话由 PR/MR/Gerrit 保存；没有外部后端时，由调用方把未解决 finding 暂存到 `work.md`。除非用户明确要求持久报告或合规要求，否则不创建 `review.md`。
