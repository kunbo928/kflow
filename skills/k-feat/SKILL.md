---
name: k-feat
description: 通过 Spec Clear 和目标行为 red → green 交付新增或变化的功能。
argument-hint: "[功能]"
---

# k-feat

先读项目地图。独立 Feature 使用 `kflow work` 创建或恢复 `works/feat-{slug}/`：`spec.md` 保存稳定契约，`work.md` 保存活动证据。Roadmap 子 Feature 直接使用既有 `roadmap-*/feats/NN-name.md` 和父级 `work.md`，不创建独立 Feature Work。

未达 **Spec Clear**（目标行为、范围与非目标、验收场景、归属和可重复测试接缝）时点名 `k-grilling`；已清则零提问。契约写在 `spec.md`。澄清阶段不写完整测试文件。模块深度见 [`references/code-design.md`](references/code-design.md)，经济性见 [`references/economy.md`](references/economy.md)。

点名 `k-implement`：选择测试与实现共同经过的调用方可见接缝；先观察目标行为 `red`，完成最小完整纵向切片，再用同一命令或探针观察 `green`。按 tracer bullet 继续，直到所有验收场景通过。

只有一个尚未解决的交互或技术选择具有明显返工成本时才使用原型。原型输出是未验证输入，不能直接晋升为生产代码。真实产品或公开契约取舍仍存在时交给 owner 决定。

运行受影响回归，再点名 `k-review` 做 Spec 与 Standards 双轴审查。点名 `k-knowledge` 做上下文同步。把实现、red/green 证据、审查结果和上下文同步写入 Spec。只有验收和双轴审查通过后才能标记 accepted。报告 `work.md` 是否具备删除条件，由用户决定，禁止自动删除。
