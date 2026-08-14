# 双轴审查

对 `git diff <base>...<head>`（三点，相对 merge-base）同时看两轴。两轴在隔离子代理中进行，互不污染上下文；汇总时不合并、不重排。

## 钉住范围

记下 `base` 与 `head` 的完整 SHA。`git rev-parse` 必须都能解析，且 diff 非空。坏引用或空 diff 在派子代理之前失败。`head` 再变，本结论 stale，须重审。

**Spec 来源**（按序）：当前 Work 的 `spec.md` 或 `feats/NN.md`；调用方给出的路径；commit 信息里的 issue。没有 spec 时 Spec 轴报告「无 spec」，不假装通过。

**Standards 来源**：仓库已有编码标准、`AGENTS.md`、局部规则。仓库文档覆盖基线气味；工具已经强制的不重复报。气味始终是判断，不是硬违规。

## 子代理

**Standards**：附上完整 diff 命令、commit 列表、标准文件路径，以及下方气味基线全文。要求：逐处引用规则或气味名；区分硬违规与判断；跳过工具已强制项。

**Spec**：附上 diff 命令、commit 列表、spec 正文。要求：(a) spec 要了但缺失或残缺；(b) diff 里没被要求的行为（scope creep）；(c) 看起来做了但做错。每条引用 spec 原句。

一轴通过不能抵消另一轴的 blocking / important。

## 气味基线

对照 diff，只报与本次改动相关的：

- **Mysterious Name** — 名字不揭示职责 → 改名；叫不出诚实名字则设计浑。
- **Duplicated Code** — 同一逻辑形状出现多次 → 抽出共享形状。
- **Feature Envy** — 方法够别人的数据比够自己的多 → 把方法挪到数据上。
- **Data Clumps** — 同一组字段总是一起走 → 收成一个类型。
- **Primitive Obsession** — 用原始类型顶领域概念 → 给概念一个小类型。
- **Repeated Switches** — 同一类型的分支在多处重复 → 多态或共享映射。
- **Shotgun Surgery** — 一件事要改很多文件 → 把一起变的收进一个模块。
- **Divergent Change** — 一个模块因多件无关事由被改 → 按变化原因切开。
- **Speculative Generality** — spec 没有的抽象、参数、钩子 → 删掉，用到再抽。
- **Message Chains** — 长链 `a.b().c().d()` → 在第一对象上藏住行走。
- **Middle Man** — 几乎只转发 → 去掉，直调目标。
- **Refused Bequest** — 子类忽略或覆盖大部分继承 → 改组合。

## 汇总

分 `## Spec` 与 `## Standards` 呈现，不跨轴挑「最大问题」。终态：无 blocking/important 则 `review_passed`；否则列未勾项。nit 写入报告，不挡 `accepted`。
