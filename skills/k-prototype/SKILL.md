---
name: k-prototype
description: 制作可丢弃产物，回答一个产品或技术决策。
argument-hint: "[待验证决策]"
---

# k-prototype

先读项目地图。独立原型通过 `kflow work` 使用 `works/prototype-{slug}/`；服务于其他 Work 的原型作为其内部资产。

Spec Clear 要求明确一个决策问题、假设、最低产物、观察项、退出条件和处置计划。只制作足以让 owner 判断问题的保真度。需要人类取舍的决策，必须由 owner 看过具体产物后回答，Agent 不能代答。

记录观察、决定、生产差距和产物指针。原型代码可丢弃，不能静默晋升；需要复用时，必须重新进入 Feature，从目标 red 做到完整 green。原型结果不授予生产实现权限。把决定同步到其 owner，并报告 `work.md` 是否具备删除条件，由用户决定。
