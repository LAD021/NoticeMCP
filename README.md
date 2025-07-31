# Notice MCP Server

一个用于发送通知的 Model Context Protocol (MCP) 服务器，支持多种通知后端，可在大模型任务完成时发送通知。

## 功能特性

- 🚀 支持多种通知后端（邮件、Webhook、Slack）
- 🔧 可扩展的后端架构
- 📝 完整的TypeScript类型支持
- 🛡️ 输入验证和错误处理
- 📊 详细的发送结果和元数据

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
- `backend` (string): 后端类型 (`email` | `webhook` | `slack`)
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

## 许可证

MIT License