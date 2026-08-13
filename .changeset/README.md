# Changesets

每个会影响 npm 包、CLI 或已发布 Skill 行为的改动都需要 Changeset：

```bash
npm run changeset
```

根据公开兼容性选择 patch、minor 或 major。纯文档、测试和发布工具调整通常不需要 Changeset。

Changesets Action 会在 `main` 上维护 Release PR；合并 Release PR 后，通过 npm Trusted Publishing 发布准备好的版本。
