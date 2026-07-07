# 阶段收尾与提交

## 收尾推荐

feature-acceptance 结束后按顺序判断：

1. `k-learn`
2. `k-decide`
3. `k-guide`
4. `k-libdoc`
5. scoped commit

issue-fix 结束后：

1. `k-learn`
2. `k-decide`
3. scoped commit

feature-ff 结束后：

1. `k-learn`
2. `k-decide`
3. scoped commit

统一规则：一律一句话提示；用户说“不用”立即跳过；不强制。

## Scoped Commit

acceptance / issue-fix / feature-ff 走完后，可把本次产物提交为一个 commit。

范围：

- 本次工作改到的代码
- 相关 spec 文档
- 本次实际更新过的架构 doc / req doc
- 本次实际更新过的 roadmap items.yaml / 主文档

不该进：

- 无关顺手修改
- 属于下次 feature / issue 的扩大范围

提交前必须确认用户同意。commit message 一句话说清做了什么，不贴 spec 目录路径。
