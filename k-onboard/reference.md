# onboard 参考模板

本文件提供 `k-onboard` 使用的骨架模板。

## 1. `.kflow/architecture/ARCHITECTURE.md` 占位模板

```markdown
# {项目名} 架构总入口

> 状态：骨架（待填充）
> 创建日期：YYYY-MM-DD

## 1. 项目简介

## 2. 核心概念 / 术语表

## 3. 子系统 / 模块索引

## 4. 关键架构决定

## 5. 已知约束 / 硬边界
```

## 2. `.kflow/attention.md` 最小模板

attention.md 是执行类 kflow 技能启动前读取的短提醒清单。onboard 创建最小骨架，不替项目 owner 填实质内容；后续短规则由 `k-note` 追加。

```markdown
# Attention

本文件是 kflow 执行类技能启动前读取的短提醒清单。路由类技能只检查它是否存在；真正动手改代码 / 写文档前再读全文。

原则：一条一行，最多 50 条有效项目。详细背景请沉淀到 compound / architecture / requirement / feature / issue 文档，这里只保留短提醒和链接。

## 项目碎片知识

<!-- k-note managed: 用 k-note 维护，新条目按下面分节追加 -->

### 编译与构建

### 运行与本地起服务

### 测试

### 命令与脚本陷阱

### 路径与目录约定

### 环境变量与凭证

### 其他
```
