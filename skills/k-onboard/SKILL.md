---
name: k-onboard
description: 为仓库建立首份经过核实的项目地图和 Agent 协作契约。
---

# k-onboard

kflow 骨架或 Skill 缺失时运行 `kflow init --skill k-onboard`。对仓库做有界扫描，直到项目具备可路由上下文：

- 确认项目目的和系统边界；
- 确认主要交付区域及其事实归宿；
- 核实实际存在的构建、测试、检查、运行和发布入口；
- 找到根目录及局部 `AGENTS.md`；
- 指向架构、领域、Roadmap 和知识资产的现有归宿；
- 未核实区域标记为“未知”，不自行推断。

`.kflow/project-map/index.md` 只保存低分辨率路由。只有真实加载分支需要时，才创建 `development.md`、`architecture.md` 或 `areas/*.md`。地图保存用途、边界、事实指针和校验方式，不复制可由代码重建的目录树或 owner 正文。

根 `AGENTS.md` 不存在时创建最小协作契约；已存在时只补充有边界的 kflow 区块，说明渐进加载、事实归属、验证和局部规则。已有规则冲突或无法核实时，交由 owner 决定，不静默重写。

完成标准：`kflow map validate --skill k-onboard` 通过，并且新 Agent 无需读取整个地图就能选择下一份相关上下文。
