---
name: k-roadmap
description: 把大需求发现、拆分并交付为共享的渐进式 Feature 地图。
argument-hint: "[大需求]"
---

# k-roadmap

先读项目地图，并用 `kflow work` 创建或恢复 `works/roadmap-{slug}/`。`spec.md` 是共享地图，`work.md` 是执行状态，`feats/` 保存可交付子 Feature。

## 绘图

先明确目的地、范围、非目标和整体验收，再广度优先区分：

- **待决策**：能够精确陈述的路线级问题。事实由 Agent 调研；产品取舍由 owner 决定，Agent 提供证据、选项、权衡和建议。
- **尚未明确**：仍无法精确陈述的范围内迷雾。
- **Feature**：路线已经清晰、可独立观察的纵向交付项。

路线级拷问只处理目的地和迷雾；未清时点名 `k-grilling`，已清则零提问。Feature 按需创建为 `feats/NN-readable-name.md`。编号只表示稳定展示和默认推进顺序；frontmatter 中的 `id`、`status`、`depends_on` 才定义身份和真实依赖。每个文件保存目标行为、范围与非目标、验收场景、测试契约、必要设计约束和最终结果。子 Feature 不再创建平行的独立 `feat-*` Work。

路线清晰必须同时满足：路线级决策与迷雾已清空；术语单义；每个 Feature 都有可重复接缝和显式依赖；新 Agent 只读 Roadmap 就能判断 frontier 和整体完成标准。冻结 proposed Roadmap，完成设计审查并获得 owner 接受后才能执行。

## 执行

frontier 是依赖均已 accepted 的 proposed Feature。默认一次推进一个；只有 owner 选择并行且不存在共享归属接缝时才并行。每个子 Feature 与独立 feat 同一条链：未达 Spec Clear 时点名 `k-grilling`，再点名 `k-implement`（目标行为 red、最小纵向切片、同一信号 green），再点名 `k-review` 做 Spec 与 Standards 双轴审查，再点名 `k-knowledge`。活动状态和未解决 finding 写入父级 `work.md`，稳定结果写入子 Feature 文件。

目的地、Feature 边界、依赖或验收变化时，重新进行 Roadmap 审查和 owner 接受。全部 Feature 完成后运行集成验收和最终双轴审查，同步稳定项目上下文。整体验收和双轴审查通过后才能标记 accepted；报告 `work.md` 是否具备删除条件，由用户决定。
