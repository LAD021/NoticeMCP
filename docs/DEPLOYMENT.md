# Notice MCP 部署指南

本指南将帮助您部署和配置 Notice MCP 服务器。

## 快速开始

### 1. 环境要求

- Node.js 18+ 
- npm 或 yarn
- 支持 MCP 的客户端（如 Claude Desktop）

### 2. 安装步骤

```bash
# 克隆或下载项目
cd NoticeMCP

# 安装依赖（如果网络正常）
npm install

# 或者手动安装核心依赖
npm install @modelcontextprotocol/sdk zod

# 构建项目（如果有TypeScript）
npm run build

# 测试功能
node test-server.js
```

### 3. Claude Desktop 配置

在 Claude Desktop 的配置文件中添加：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/NoticeMCP/dist/index.js"]
    }
  }
}
```

如果使用测试版本：
```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/NoticeMCP/test-server.js"]
    }
  }
}
```

## 后端配置

### 邮件后端配置

#### Gmail SMTP
```json
{
  "to": "recipient@example.com",
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

**注意**: Gmail 需要使用应用专用密码，不是普通密码。

#### Outlook/Hotmail SMTP
```json
{
  "to": "recipient@example.com",
  "smtp": {
    "host": "smtp-mail.outlook.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@outlook.com",
      "pass": "your-password"
    }
  }
}
```

#### 企业邮箱 SMTP
```json
{
  "to": "recipient@company.com",
  "smtp": {
    "host": "smtp.company.com",
    "port": 465,
    "secure": true,
    "auth": {
      "user": "your-email@company.com",
      "pass": "your-password"
    }
  }
}
```

### Slack 配置

#### 创建 Slack Webhook
1. 访问 https://api.slack.com/apps
2. 创建新应用或选择现有应用
3. 启用 "Incoming Webhooks"
4. 创建新的 Webhook URL
5. 复制 Webhook URL

```json
{
  "webhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
  "channel": "#notifications",
  "username": "Notice Bot",
  "iconEmoji": ":robot_face:"
}
```

### Webhook 配置

#### Discord Webhook
```json
{
  "url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### Microsoft Teams Webhook
```json
{
  "url": "https://outlook.office.com/webhook/YOUR_TEAMS_WEBHOOK_URL",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### 自定义 API
```json
{
  "url": "https://api.yourservice.com/notifications",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json",
    "X-Source": "notice-mcp"
  },
  "timeout": 10000
}
```

## 使用示例

### 在 Claude 中使用

```
请帮我发送一个通知，告诉团队AI模型训练已完成。使用Slack发送到#ai-team频道。
```

Claude 会自动调用 `send_notification` 工具：

```json
{
  "title": "🤖 AI模型训练完成",
  "message": "您的模型训练任务已成功完成！\n\n详细信息：\n- 准确率: 95.2%\n- 训练时间: 2小时15分钟\n- 模型保存路径: /models/latest.pth",
  "backend": "slack",
  "config": {
    "webhookUrl": "YOUR_SLACK_WEBHOOK_URL",
    "channel": "#ai-team",
    "username": "AI Bot"
  }
}
```

### 批量通知

```
请同时发送邮件和Slack通知，告知数据处理任务完成。
```

## 故障排除

### 常见问题

1. **MCP 服务器无法启动**
   - 检查 Node.js 版本是否 >= 18
   - 确认文件路径正确
   - 查看 Claude Desktop 日志

2. **邮件发送失败**
   - 检查 SMTP 配置
   - 确认邮箱密码/应用密码正确
   - 检查防火墙设置

3. **Slack 通知失败**
   - 验证 Webhook URL 有效性
   - 检查频道权限
   - 确认 Webhook 未被禁用

4. **Webhook 超时**
   - 增加 timeout 设置
   - 检查目标服务器状态
   - 验证网络连接

### 调试模式

运行测试脚本查看详细输出：
```bash
node test-server.js
```

### 日志查看

检查 Claude Desktop 日志：
- macOS: `~/Library/Logs/Claude/`
- Windows: `%LOCALAPPDATA%\Claude\logs\`

## 安全注意事项

1. **敏感信息保护**
   - 不要在代码中硬编码密码、Token
   - 使用环境变量存储敏感配置
   - 定期轮换 API 密钥

2. **网络安全**
   - 使用 HTTPS/TLS 连接
   - 验证 Webhook 来源
   - 限制访问权限

3. **配置文件安全**
   - 设置适当的文件权限
   - 不要提交包含密钥的配置文件

## 扩展开发

### 添加新后端

1. 在 `src/backends/` 创建新文件
2. 实现 `NotificationBackend` 接口
3. 在 `src/index.ts` 中注册后端
4. 更新文档和示例

### 自定义消息格式

可以在各个后端中自定义消息格式，支持：
- Markdown 格式
- HTML 格式
- 富文本附件
- 图片和文件

## 生产部署

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 环境变量配置

```bash
# .env 文件
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 监控和日志

建议添加：
- 健康检查端点
- 指标收集
- 错误日志记录
- 性能监控