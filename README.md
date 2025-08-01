# Notice MCP Server

一个专为 AI 助手设计的 Model Context Protocol (MCP) 通知服务器，让 AI 能够主动向用户发送任务完成、错误提醒和状态更新等重要通知。

> 🤖 **专为 AI 助手设计**：详细了解如何让 AI 助手使用此工具，请参阅 [AI 助手使用指南](./AI_ASSISTANT_GUIDE.md)

## 功能特性

- 🚀 支持多种通知后端（邮件、Webhook、Slack、MacOS系统通知）
- 📋 TOML配置文件管理，支持环境变量映射
- 🔧 可扩展的后端架构
- 📝 完整的TypeScript类型支持
- 🛡️ 输入验证和错误处理
- 📊 详细的发送结果和元数据
- ⚙️ 配置热重载和验证功能

## 支持的通知后端

### 1. 邮件 (Email)
- 通过SMTP发送邮件通知
- 支持多个收件人
- 可配置SMTP服务器

### 2. Webhook
- 发送HTTP请求到指定URL
- 支持自定义请求头和方法
- 内置常见平台格式（Slack、Discord、Teams）

### 3. Slack
- 通过Webhook发送Slack消息
- 支持富文本格式
- 可配置频道、用户名、图标

### 4. MacOS系统通知
- 发送原生MacOS桌面通知
- 支持标题、副标题和系统声音
- 无需额外配置，直接使用系统通知中心

## 配置管理

### TOML配置文件

Notice MCP Server 支持使用 TOML 配置文件来管理所有后端配置。在项目根目录创建 `config.toml` 文件：

```toml
[server]
name = "Notice MCP Server"
version = "1.0.0"
port = 3000
debug = false

[logging]
level = "info"
file = "notice.log"
enable_console = true

[backends.macos]
enabled = true
default_sound = "Glass"
default_subtitle = "来自 Notice MCP"
show_in_notification_center = true

[backends.email]
enabled = true
default_from = "noreply@yourapp.com"
default_subject = "通知来自 Notice MCP"

[backends.email.smtp]
host = "smtp.gmail.com"
port = 587
secure = false
# 敏感信息可通过环境变量设置
# user = "your-email@gmail.com"
# pass = "your-app-password"

[templates.success]
title = "✅ 成功"
message = "操作已成功完成"
sound = "Hero"
```

### 环境变量支持

敏感信息可通过环境变量设置：

```bash
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"
export SLACK_TOKEN="xoxb-your-slack-bot-token"
```

详细配置说明请参考 [TOML配置指南](./TOML_CONFIG_GUIDE.md)。

## 安装和使用

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 启动服务器

```bash
npm start
```

### 4. 开发模式

```bash
npm run dev
```

## MCP工具

### send_notification

发送通知到指定后端。

**参数：**
- `title` (string): 通知标题
- `message` (string): 通知内容
- `backend` (string): 后端类型 (`email` | `webhook` | `slack` | `macos`)
- `config` (object, 可选): 后端特定配置

**示例：**

```json
{
  "title": "任务完成",
  "message": "您的AI模型训练已完成，准确率达到95%",
  "backend": "slack",
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
    "channel": "#notifications",
    "username": "AI Assistant"
  }
}
```

### get_backends

获取所有可用的通知后端列表。

## 配置示例

### 邮件配置

```json
{
  "to": ["user@example.com", "admin@example.com"],
  "from": "noreply@yourapp.com",
  "subject": "自定义主题",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  }
}
```

### Webhook配置

```json
{
  "url": "https://your-webhook-endpoint.com/notify",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer your-token",
    "X-Custom-Header": "value"
  },
  "timeout": 5000
}
```

### Slack配置

```json
{
  "webhookUrl": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
  "channel": "#general",
  "username": "NoticeBot",
  "iconEmoji": ":robot_face:"
}
```

### MacOS系统通知配置

```json
{
  "subtitle": "来自AI助手",
  "sound": "Glass"
}
```

**可用的系统声音：**
- `Basso`, `Blow`, `Bottle`, `Frog`, `Funk`
- `Glass`, `Hero`, `Morse`, `Ping`, `Pop`
- `Purr`, `Sosumi`, `Submarine`, `Tink`

**MacOS通知示例：**

```json
{
  "title": "任务完成",
  "message": "您的AI模型训练已完成",
  "backend": "macos",
  "config": {
    "subtitle": "深度学习任务",
    "sound": "Hero"
  }
}
```

## 扩展新后端

要添加新的通知后端，需要实现 `NotificationBackend` 接口：

```typescript
import { NotificationBackend, NotificationResult } from './notification/types.js';

export class CustomBackend implements NotificationBackend {
  getDescription(): string {
    return '自定义通知后端描述';
  }

  getRequiredConfig(): string[] {
    return ['requiredField1', 'requiredField2'];
  }

  validateConfig(config: Record<string, any>): boolean {
    // 验证配置逻辑
    return true;
  }

  async send(
    title: string,
    message: string,
    config?: Record<string, any>
  ): Promise<Partial<NotificationResult>> {
    // 发送逻辑实现
    return {
      messageId: 'custom_message_id',
      metadata: { /* 自定义元数据 */ }
    };
  }
}
```

然后在 `src/index.ts` 中注册：

```typescript
this.notificationManager.registerBackend('custom', new CustomBackend());
```

## 在Claude Desktop中使用

在Claude Desktop的配置文件中添加：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/path/to/NoticeMCP/dist/index.js"]
    }
  }
}
```

## 使用场景

- 🤖 AI模型训练完成通知
- 📊 数据处理任务完成提醒
- 🔍 长时间运行的分析任务结果通知
- 📈 定期报告和状态更新
- 🚨 错误和异常情况警报

## 开发

### 项目结构

```
src/
├── index.ts              # MCP服务器主入口
├── notification/
│   ├── manager.ts        # 通知管理器
│   └── types.ts          # 类型定义
└── backends/
    ├── email.ts          # 邮件后端
    ├── webhook.ts        # Webhook后端
    └── slack.ts          # Slack后端
```

### 添加测试

```bash
npm test
```

## 🤖 AI 助手集成

### 核心价值
Notice MCP Server 专为 AI 助手设计，让 AI 能够：
- ✅ 主动通知任务完成状态
- ❌ 及时报告错误和异常
- 📊 发送进度更新和状态信息
- ⚠️ 提供重要提醒和警告

### 使用场景
- **长时间任务**：代码编译、数据处理、文件上传等
- **错误处理**：权限问题、网络异常、资源不足等
- **状态监控**：服务器状态、任务进度、系统警告等

### 快速开始

**Trae AI 用户：**
1. 参考 [Trae AI 配置指南](./TRAE_SETUP.md) 配置 MCP 设置
2. 重启 Trae AI
3. AI 助手自动获得 `send_notification` 工具

**Claude Desktop 用户：**
1. 参考 [Claude Desktop 配置指南](./CLAUDE_DESKTOP_SETUP.md) 配置 MCP 设置
2. 重启 Claude Desktop
3. AI 助手自动获得 `send_notification` 工具

## 📚 相关文档

- [AI 助手使用指南](./AI_ASSISTANT_GUIDE.md) - 详细的 AI 集成说明
- [Trae AI 配置指南](./TRAE_SETUP.md) - Trae AI MCP 配置
- [Claude Desktop 配置指南](./CLAUDE_DESKTOP_SETUP.md) - Claude Desktop MCP 配置
- [TOML 配置指南](./TOML_CONFIG_GUIDE.md) - 配置文件详解
- [部署指南](./DEPLOYMENT.md) - 生产环境部署

## 许可证

MIT License