---
title: 发布策略
description: 版本规则、changeset 与升级预期。
---

fatigue-kit 的已发布包遵循语义化版本。补丁版本提供兼容修复和文档；次版本增加向后兼容能力；主版本可能改变公共 API 或持久化语义。

核心和 React 绑定是独立版本包，通过 peer dependency 声明兼容范围。升级前应阅读各包 changelog 和已发布 changeset。持久记录带格式版本；旧代码遇到未知未来版本会视为空，而不会猜测结构。

路线图表达方向，不承诺日期或必然发布。