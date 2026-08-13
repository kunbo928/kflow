# Code Review 记录的生命周期

## 结论

Code Review 的逐条意见、往返讨论和 `resolved` / `outdated` 状态，应由 PR、MR 或 Gerrit 等审查系统保存；仓库中的 Work 文件不应复制这份会话史。仓库只保留审查最终形成的长期事实、决策、契约和可执行约束，并在需要时链接审查记录。

因此，kflow 不应为每个 Work 固定生成永久 `review.md`，也不应把每条已解决 finding 写回 `spec.md`。

## 一手实践

### 审查平台拥有完整的审查会话

[GitHub Pull Request Review](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)把 review、逐行 conversation、批准或要求修改以及 resolved/outdated 状态保存在 Pull Request 中。解决 conversation 会将整段讨论折叠并标记为 resolved；超出当前变更范围但仍重要的反馈，应建立新 issue 并链接原评论。

[GitLab Merge Request](https://docs.gitlab.com/user/project/merge_requests/)同样以 MR discussion/thread 保存审查过程。已结束的 thread 被 resolve；重要但不应阻塞当前合并的 thread 可以迁移为 issue，并由系统保留双向联系。[GitLab approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)则在 MR 上维护 reviewer 状态和 approval gate。

[Gerrit](https://gerrit-review.googlesource.com/Documentation/user-porting-comments.html)将评论关联到 patch set：未解决评论会显示在后续 patch set，已解决评论不再向前携带，但仍存在于原 patch set、Comments Tab 和 Change Log。[Review UI](https://gerrit-review.googlesource.com/Documentation/user-review-ui.html)还明确区分 `Done` 和 `Ack`。这体现了一个稳定边界：当前工作上下文只携带未解决项，完整历史由审查系统保存。

### 仓库文档保存可恢复的执行上下文和长期理由

[OpenAI Codex ExecPlans](https://github.com/openai/openai-cookbook/blob/main/articles/codex_exec_plans.md)要求长任务的 living plan 维护 Progress、Surprises & Discoveries、Decision Log 和 Outcomes & Retrospective，使另一位 Agent 能仅凭计划恢复工作。它要求保存决定及理由和验证证据，但没有要求把外部 review 的逐条对话复制进计划。

[MADR](https://adr.github.io/madr/)和 Michael Nygard 的[架构决策记录实践](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)保存架构显著决定的 context、options、decision、rationale 和 consequences。被替代的决定仍保留并标记 superseded。长期文档保存的是为何作出决定，而不是促成决定的每一句审查评论。

## 信息归属

| 信息 | 默认 owner | 是否写入 Work |
| --- | --- | --- |
| 逐行 finding、回复、resolved/outdated 状态 | PR / MR / Gerrit | 不复制，只保存链接或 ID |
| Review 是否通过、仍有哪些阻塞项 | 审查系统；无审查系统时为 `work.md` | 执行期保留 |
| 由 finding 改变的行为契约 | `spec.md` | 写入最终契约，不保留评论措辞 |
| 架构决定及理由 | ADR 或 architecture owner | 只在 Spec 中链接或摘要 |
| 新的协作规范 | `AGENTS.md` | 不在 Spec 重复 |
| 可机械化约束 | test、lint、checker | 记录验证指针即可 |
| 项目入口或模块导航变化 | Project Map | 记录 context sync 指针 |
| 超出范围但仍应处理的 finding | 新 Issue / Refactor Work | 原 Work 只链接新 Work |

## 对 kflow 的具体建议

### 有 PR、MR 或 Gerrit

- 完整 findings、讨论、patch-set 演进和 resolution 留在审查平台。
- 活动 `work.md` 只保存审查 URL/ID、当前 gate、未解决阻塞项和下一步。
- Work 完成时，`spec.md` 最多保留简短结果，如 `spec review: passed`、`standards review: passed` 和审查指针。
- finding 若形成长期决定，应更新真正的 canonical owner；不要把同一事实同时长期保存在 review、Spec 和 Project Map。

### 没有外部审查平台的直接任务

- 本地 Review 的活动 findings 暂存在 `work.md` 的 Review 区段，供下一位 Agent 恢复。
- finding 修复并复核后，从活动清单移除或压缩为结论，不长期保留逐条对话。
- 仍未解决且跨出当前任务边界的 finding，升级为独立 `issue-*`、`refactor-*` 或 `architecture-*` Work。
- 若用户选择保留 `work.md`，它可以作为过程证据继续存在；若用户选择删除，必须先完成上述归属迁移。

### Roadmap 子 Feat

- `roadmap-*/feats/01-*.md` 保存该 Feat 的行为、验收和最终交付结果，不复制审查会话。
- Roadmap 的 `work.md` 保存当前 Feat 的未解决 Review gate 和恢复状态。
- 子 Feat 通过 Review 后，只写通过状态、验证证据和外部审查指针；跨 Feat 的 finding 应提升到 Roadmap 或创建新的 Work。

### 何时生成 `review.md`

仅在用户明确要求审查报告、审计/合规要求需要仓库内完整留档，或没有任何持久化 review backend 且确实需要完整报告时生成。它是可选审查产物，不是每个 Work 的固定文件，也不应成为行为或架构事实的 canonical owner。

## 推荐协议

一句话规则：**review system 保存会话史，repository 保存由 review 促成的长期决定和可执行约束，两者之间只留稳定指针。**

对 `spec.md` / `work.md` 生命周期，建议采用：

1. Review 期间，未解决 finding 位于外部 review system；没有外部系统时暂存 `work.md`。
2. Review 通过后，`spec.md` 只记录双轴结果、验证证据、审查指针和由 finding 改写后的最终契约。
3. 长期架构理由、规范、测试约束和项目导航分别回流到 ADR、`AGENTS.md`、测试/checker 和 Project Map。
4. 超出范围的 finding 变成新的 Work，不以“已知问题”埋在已完成 Spec 中。
5. `work.md` 不自动删除；用户决定是否保留。若删除，先确保未解决项、恢复信息和长期事实均已迁移。
