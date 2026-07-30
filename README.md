> [English version](./README.en.md)

# NoticeMCP

把 AI Agent 的任务结果发送到 macOS 通知中心和飞书群聊的 MCP 通知服务器。

NoticeMCP 适合长时间运行的编码、研究和自动化任务：Agent 完成工作或遇到错误时，可以调用 `send_notification` 主动提醒你。项目已经发布 Git 标签，当前版本为 **v0.3.1**，核心入口可直接使用 Node.js 运行。

## 为什么使用 NoticeMCP

- **面向 Agent**：通过 Model Context Protocol 暴露通知工具。
- **双通知后端**：支持 macOS 原生通知和飞书自定义机器人 Webhook。
- **一次调用，多处送达**：向配置中所有已启用的后端并行发送。
- **本地配置**：使用 TOML 管理后端，`config.toml` 默认不会提交到 Git。
- **可接入现有客户端**：仓库内提供 Trae AI 和 Claude Desktop 配置指南。

## 当前能力

| 能力 | 状态 | 说明 |
|---|---|---|
| `send_notification` | 可用 | 接收 `title` 和 `message` |
| macOS 通知 | 可用 | 支持声音、副标题、超时等选项 |
| 飞书通知 | 可用 | 支持自定义机器人 Webhook、签名和 @ 配置 |
| 多后端发送 | 可用 | 单个后端失败不会阻止其他后端执行 |

## 快速开始

要求：Node.js 和 npm；macOS 通知后端仅适用于 macOS。飞书后端需要你自己的自定义机器人 Webhook。

```bash
git clone https://github.com/LAD021/NoticeMCP.git
cd NoticeMCP
npm install
cp config.example.toml config.toml
```

编辑 `config.toml`，只启用你需要的后端：

```toml
[backends.macos]
enabled = true

[backends.feishu]
enabled = false
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_TOKEN"
```

不要把真实 Webhook 提交到仓库。配置完成后启动服务器：

```bash
node start.js
```

## 接入 MCP 客户端

以下是通用的 stdio 配置结构，请把路径替换为本机仓库的绝对路径：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/NoticeMCP/start.js"]
    }
  }
}
```

- [Trae AI 设置指南](./docs/TRAE_SETUP.md)
- [Claude Desktop 设置指南](./docs/CLAUDE_DESKTOP_SETUP.md)
- [TOML 配置指南](./docs/TOML_CONFIG_GUIDE.md)

## MCP 工具

### `send_notification`

```json
{
  "title": "任务完成",
  "message": "构建和检查已经结束。"
}
```

服务器会把消息发送到 `config.toml` 中所有已启用的后端，并分别返回成功或失败结果。

## 项目状态

- 当前版本：`v0.3.1`
- 发布形式：Git 标签（仓库当前没有单独的 GitHub Release 页面）
- 许可证：MIT
- 主要实现：JavaScript / TypeScript

仓库保留了早期测试和实验脚本。部分历史测试仍依赖旧的构建产物或本地通知环境，因此请把真实客户端接入与目标通知后端的实际送达作为部署验收步骤。

## 安全说明

- 将 `config.toml` 留在本地；它已被 `.gitignore` 忽略。
- 不要在 Issue、日志或截图中公开飞书 Webhook 和签名密钥。
- 建议在飞书机器人侧开启关键词、IP 白名单或签名校验。

## 许可证与反馈

本项目采用 [MIT License](./LICENSE)。问题和改进建议请提交到 [GitHub Issues](https://github.com/LAD021/NoticeMCP/issues)。
