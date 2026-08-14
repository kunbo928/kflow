---
name: k-grilling
description: 拷问未清的取舍直到 Spec Clear。需求已清可以零提问。
argument-hint: "[要澄清的问题]"
---

# k-grilling

拷问是完成条件，不是仪式。未达 Spec Clear 才提问；已清则零提问。不新建 Work 类型。领域词见 [`references/domain.md`](references/domain.md)。

把未决事项画成决策树。frontier 是前提已定、现在就能问的问题。每轮一次问完整 frontier：编号、推荐答案，然后等用户。事实由 Agent 查仓库；产品取舍才问人。依赖本轮仍开放答案的问题放到下一轮。

```
❓ **Q1** - **<标题>**：<题干与选项>

➡️ <推荐答案>
```

契约写在当前 Work 的 `spec.md`（子项写在 `feats/NN.md`）：验收场景 + 测试契约（接缝与探针）。澄清阶段不写完整测试文件。frontier 清空且行为、范围、验收、测试接缝、归属或取舍已齐，即 Spec Clear。
