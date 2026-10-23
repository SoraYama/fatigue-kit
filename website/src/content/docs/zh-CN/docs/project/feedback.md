---
title: 求助与反馈
description: 获取接入帮助、提交可复现问题，或分享项目采用 fatigue-kit 的情况。
---

[接入求助或报告问题](https://github.com/SoraYama/fatigue-kit/issues/new?template=bug-report.yml) · [提出功能建议](https://github.com/SoraYama/fatigue-kit/issues/new?template=feature-request.yml) · [分享使用反馈](https://github.com/SoraYama/fatigue-kit/issues/new?template=adoption-feedback.yml)

## 接入遇到阻碍？

请提供包版本、平台、adapter、规则、namespace/key 隔离方式和复现步骤，并说明预期与实际行为、是否阻碍接入以及已知绕过方法。最小示例即可，无需公开业务源码。

如果希望刷新后保留记录，请先检查是否选择了持久化存储。默认引擎使用内存；本地状态不能保证跨 tab、进程或设备的权威配额。参见 [已知限制](../known-limitations/)。

## 分享可复现状态

在 [演练场](../../../playground/) 中还原规则、推进模拟时间并复制分享链接。发布前请把真实标识和记录替换成虚构数据：URL 包含 key、规则、时钟和记录。若问题依赖实际 adapter 或框架，请同时提供最小代码；演练场使用内存。

生成的 Web 代码使用 localStorage 和设备时钟，不会导入演练记录。消费应靠近实际展示动作，React Hooks 不得在 render 或 mount 时消费。

## 告诉我们试用之后发生了什么

使用反馈表会询问原有方案、尝试本库的原因、最费时间的一步，以及是否已接入、继续使用或停止采用。接入至少 14 天后的反馈有助于判断持续价值；低频 UI 无需每天调用才算有用。

反馈内容公开可见，欢迎匿名描述项目。表中的“后续随访”与“匿名案例引用”是分开的可选许可，无需填写联系方式。合并代码与解决实际问题分别记录：修复或说明会回到原 Issue，并记录你是否能够验证。
