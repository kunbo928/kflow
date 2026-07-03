# Feature Checklist 生命周期

`{slug}-checklist.yaml` 是标准 feature 工作流的唯一执行清单。

## 职责

- `k-feat-design`：design 通过后一次生成 `steps` + `checks`
- `k-feat-impl`：按 `steps` 顺序执行，只更新 `steps[].status`
- `k-feat-accept`：只更新 `checks[].status`
- `k-feat-ff`：不生成 checklist，只写 `{slug}-ff-note.md`

## Steps 粒度

`steps` 是编排-计算分离维度的切片策略，不写 file:line / 函数级落点。

典型节奏：

- 后端：编排骨架 → 计算节点逐个填 → 持久化 / 边界接入 → 关键路径测试与回归
- 前端：静态结构 → 交互逻辑 → 状态接入 → 关键路径测试与回归

每步必须有独立可验证的退出信号。实现阶段发现需要拆分某步或插入微重构，先和用户对齐，再追加 / 拆分 steps。

## Checks 来源

- 明确不做 → 范围守护
- 名词层接口 → 名词契约
- 编排层主流程 / 流程级约束 → 编排骨架
- 挂载点 → 挂载点
- 验收场景清单 → 验收场景

子技能描述 checklist 时只写本阶段读 / 写哪一部分，不重新定义生命周期。
