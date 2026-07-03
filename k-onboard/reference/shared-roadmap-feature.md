# Roadmap ↔ Feature 衔接

`.kflow/roadmap/{slug}/{slug}-items.yaml` 是规划层和 feature 执行层的唯一接口。

## 状态机

```text
planned     -> in-progress  （k-feat-design 启动 feature）
in-progress -> done         （k-feat-accept 验收完成）
planned     -> dropped      （k-roadmap update 放弃）
```

`done` / `dropped` 是终态。需要回退重做时新加一条 slug 略改的条目。

## 职责

`k-roadmap`：

- 生成和维护 roadmap 主文档 + items.yaml
- 用户放弃时把 `planned` 改 `dropped`
- 不改 `in-progress` / `done`

`k-feat-design` 从 roadmap 起头时：

1. design frontmatter 加 `roadmap` + `roadmap_item`
2. items.yaml 对应条目改 `status: in-progress` + `feature: YYYY-MM-DD-{slug}`
3. 校验 yaml

`k-feat-accept`：

1. 读 design frontmatter `roadmap` / `roadmap_item`
2. 空值跳过
3. 有值则 items.yaml 改 `done`，并同步 roadmap 主文档子 feature 清单
4. 验收报告记录回写结果

每份 items.yaml 只有一条 `minimal_loop: true`，代表端到端最窄闭环，design 启动时优先。
