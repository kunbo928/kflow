---
name: k-review
description: 对冻结的 git base/head 做独立 Spec 与 Standards 双轴审查。
argument-hint: "[范围或目标]"
---

# k-review

对一份冻结 diff 返回终态。实施者只能自审预检；最终批准者必须独立于实施者（可以是另一个 Agent；人不必须在环上）。小改动可降深度，不可取消终审、不可作者自批。

审查前记下 git `base` 与 `head`；结论只对这一对有效，`head` 再变则旧结论 stale。手法见 [`references/two-axis.md`](references/two-axis.md)。Spec 与 Standards 在隔离子代理中进行，一轴通过不能抵消另一轴阻塞项。

每个 finding 含级别（blocking、important、nit）、位置、后果和可执行修正。blocking / important 挡住 `accepted`；nit 永不挡。存在未勾的 blocking 或 important 时不能 `review_passed`。

把结论写入当前 Work 的 `work.md` 审查节：`base`、`head`、分级 finding、终态 `review_passed`。紧急且独立 reviewer 不可得时，仅 owner（人）可开 `risk_accepted`（理由、范围、补审责任）。不改产品代码。除非用户明确要求持久报告或合规要求，否则不创建 `review.md`。

复审检查完整新目标和修复增量，将旧 finding 标记为 resolved 或 unresolved，同时报告新增 finding。信息不足时返回 `NeedsContext` 及缺失内容。
