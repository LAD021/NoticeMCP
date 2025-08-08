# 🔔 NoticeMCP

> 基于 MCP 协议的智能多平台通知服务

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-compatible-orange.svg)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/version-v0.3.0-green.svg)](https://github.com/your-repo/NoticeMCP/releases)

NoticeMCP 是一个强大的通知服务器，通过 MCP (Model Context Protocol) 协议为 AI 助手提供多平台通知能力。支持飞书、macOS、邮件、Slack、Webhook 等多种通知后端，让你的 AI 助手能够主动向你发送重要信息。

## 📦 当前版本：v0.3.0

**v0.3.0 新特性：**
- ✅ **飞书通知完全支持** - 文本、富文本、卡片消息，@功能，签名验证
- ✅ **多后端同时发送** - 一次调用可同时发送到多个通知平台
- ✅ **增强的错误处理** - 详细的发送状态和错误信息反馈
- ✅ **配置优化** - 更灵活的TOML配置管理

## ✨ 核心特性

- 🔌 **MCP 协议支持** - 完全兼容 MCP 标准，无缝集成各种 AI 助手
- 🎯 **多后端支持** - 支持飞书、macOS、邮件、Slack、Webhook 等多种通知方式
- ⚙️ **灵活配置** - 基于 TOML 的配置文件，支持动态配置和热重载
- 🛠️ **调试友好** - 内置调试模式和详细日志，便于开发和故障排除
- 🔒 **安全可靠** - 支持签名验证、访问控制和错误重试机制
- 📊 **监控集成** - 内置性能监控和状态报告功能

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd NoticeMCP

# 安装依赖
npm install
```

### 2️⃣ 配置服务

```bash
# 复制配置文件模板
cp config.toml.example config.toml

# 编辑配置文件
vim config.toml
```

### 3️⃣ 启动服务

```bash
# 启动 MCP 服务器
node start.js

# 或者在调试模式下启动
DEBUG=true node start.js
```

### 4️⃣ 连接 AI 助手

选择你使用的 AI 助手进行配置：

<!-- tabs:start -->

#### **Trae AI**

在 Trae AI 中添加 MCP 服务器配置：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/path/to/NoticeMCP/start.js"],
      "cwd": "/path/to/NoticeMCP"
    }
  }
}
```

详细配置请参考 [Trae AI 配置指南](TRAE_SETUP.md)

#### **Claude Desktop**

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/path/to/NoticeMCP/start.js"]
    }
  }
}
```

详细配置请参考 [Claude Desktop 配置指南](CLAUDE_DESKTOP_SETUP.md)

<!-- tabs:end -->

### 5️⃣ 发送第一条通知

在 AI 助手中尝试发送通知：

```javascript
// 在 AI 助手中调用
const result = await callTool('send_notification', {
  title: '🎉 欢迎使用 NoticeMCP',
  message: '你的第一条通知发送成功！'
});
```

## 📚 文档导航

### 🎯 快速入门
- [📖 使用指南](USAGE_GUIDE.md) - 详细的使用方法和示例
- [🔌 API 参考](API_REFERENCE.md) - 完整的 API 文档和参数说明
- [⚙️ 配置指南](TOML_CONFIG_GUIDE.md) - 配置文件详解

### 🤖 AI 助手集成
- [🔗 AI 助手指南](AI_ASSISTANT_GUIDE.md) - 通用集成指南
- [🤖 Trae AI 配置](TRAE_SETUP.md) - Trae AI 专用配置
- [🎭 Claude Desktop 配置](CLAUDE_DESKTOP_SETUP.md) - Claude Desktop 配置

### 🏗️ 开发文档
- [🏗️ 架构文档](ARCHITECTURE.md) - 系统架构和代码结构
- [🚀 部署指南](DEPLOYMENT.md) - 生产环境部署
- [🔧 扩展开发](EXTENSION_GUIDE.md) - 自定义后端开发

### 📱 后端支持
- [🐦 飞书集成](backends/FEISHU.md) - 飞书机器人配置
- [🍎 macOS 通知](backends/MACOS.md) - macOS 系统通知
- [📧 邮件通知](backends/EMAIL.md) - SMTP 邮件发送
- [💬 Slack 集成](backends/SLACK.md) - Slack 机器人集成
- [🔗 Webhook 集成](backends/WEBHOOK.md) - 自定义 Webhook

## 🎯 使用场景

### 🤖 AI 助手通知
让你的 AI 助手在任务完成、遇到错误或需要人工干预时主动通知你：

```javascript
// 任务完成通知
await callTool('send_notification', {
  title: '✅ 数据处理完成',
  message: '共处理 1000 条记录，耗时 5 分钟'
});

// 错误警告通知
await callTool('send_notification', {
  title: '⚠️ 系统警告',
  message: 'CPU 使用率超过 90%，请及时处理',
  config: {
    feishu: { atAll: true },
    macos: { sound: 'Hero' }
  }
});
```

### 📊 系统监控
集成到监控系统中，实时推送系统状态和告警信息：

```javascript
// 服务器监控告警
await callTool('send_notification', {
  title: '🚨 服务器告警',
  message: '数据库连接失败，请立即检查',
  config: {
    email: { priority: 'high' },
    slack: { channel: '#ops-alerts' }
  }
});
```

### 🔄 CI/CD 集成
在构建、测试、部署流程中发送状态通知：

```javascript
// 部署成功通知
await callTool('send_notification', {
  title: '🚀 部署成功',
  message: '项目 v1.2.3 已成功部署到生产环境',
  config: {
    slack: { channel: '#deployments' },
    feishu: { msgType: 'interactive' }
  }
});
```

## 🛠️ 支持的后端

| 后端 | 状态 | 特性 |
|------|------|------|
| 🐦 **飞书** | ✅ 稳定 | Webhook、@ 功能、卡片消息、签名验证 |
| 🍎 **macOS** | ✅ 稳定 | 系统通知、自定义声音、点击操作 |
| 📧 **邮件** | ✅ 稳定 | SMTP、HTML 邮件、附件支持 |
| 💬 **Slack** | ✅ 稳定 | Bot API、Block Kit、频道/私信 |
| 🔗 **Webhook** | ✅ 稳定 | 自定义 HTTP 请求、认证支持 |
| 📱 **微信** | 🚧 开发中 | 企业微信机器人 |
| 💬 **钉钉** | 📋 计划中 | 钉钉机器人集成 |

## 🔧 配置示例

### 基本配置

```toml
# config.toml
[backends.feishu]
enabled = true
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/xxx"

[backends.macos]
enabled = true
default_sound = "Glass"

[backends.email]
enabled = false
[backends.email.smtp]
host = "smtp.gmail.com"
port = 587
```

### 高级配置

```toml
[development]
debug_mode = true
verbose_logging = true

[security]
allowed_ips = ["127.0.0.1", "::1"]
require_https = false

[performance]
max_concurrent_requests = 10
request_timeout = 5000
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 🐛 报告问题
- 在 [GitHub Issues](https://github.com/your-username/NoticeMCP/issues) 中报告 Bug
- 提供详细的错误信息和复现步骤
- 包含系统环境和版本信息

### 💡 功能建议
- 在 [GitHub Discussions](https://github.com/your-username/NoticeMCP/discussions) 中提出建议
- 描述使用场景和预期效果
- 讨论实现方案

### 🔧 代码贡献
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [MCP Protocol](https://modelcontextprotocol.io/) - 模型上下文协议
- [Docsify](https://docsify.js.org/) - 文档生成工具
- 所有贡献者和用户的支持

---

<div align="center">

**[📖 查看完整文档](USAGE_GUIDE.md)** |
**[🔌 API 参考](API_REFERENCE.md)** |
**[🏗️ 架构说明](ARCHITECTURE.md)**

*让 AI 助手更智能，让通知更及时* 🚀

</div>