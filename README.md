# Notice MCP Server

一个专为 AI 助手设计的 Model Context Protocol (MCP) 通知服务器，让 AI 能够主动向用户发送任务完成、错误提醒和状态更新等重要通知。

> 🤖 **专为 AI 助手设计**：详细了解如何让 AI 助手使用此工具，请参阅 [AI 助手使用指南](./AI_ASSISTANT_GUIDE.md)

## 📦 当前版本：v0.3.0

**v0.3.0 特性：**
- ✅ 完整的 macOS 系统通知支持
- ✅ 完整的飞书通知支持（新增）
- ✅ 稳定的 MCP 协议连接
- ✅ TOML 配置文件管理
- ✅ 完善的错误处理和状态反馈
- ✅ 多后端同时发送通知能力
- 📋 详细的通知系统配置说明

## 功能特性

- 🚀 支持多种通知后端（邮件、Webhook、Slack、MacOS系统通知、飞书通知）
- 📋 TOML配置文件管理，支持环境变量映射
- 🔧 可扩展的后端架构
- 📝 完整的TypeScript类型支持
- 🛡️ 输入验证和错误处理
- 📊 详细的发送结果和元数据
- ⚙️ 配置热重载和验证功能
- ✅ **稳定可靠**：已修复 MCP 协议连接问题，确保与 Trae AI 和 Claude Desktop 的稳定连接

## 🚀 开发状态与路线图

### 当前状态

- ✅ **macOS 系统通知**：已完全实现并测试
  - 支持标题、副标题、声音配置
  - 支持 timeout 参数（受系统设置限制）
  - 完整的错误处理和状态反馈

- ✅ **飞书通知**：已完全实现并测试（v0.3.0 新增）
  - 支持文本消息、富文本消息和卡片消息
  - 支持 @所有人、@指定用户、@手机号
  - 支持签名校验确保安全性
  - 完整的错误处理和状态反馈
  - 支持多群聊机器人配置

### v0.4.0 开发计划

- 🚧 **Windows 系统通知**：下一版本重点
  - 使用 Windows Toast 通知
  - 支持 Windows 10/11 原生通知中心
  - 计划支持操作按钮和交互

- 🚧 **邮件通知**：下一版本重点
  - SMTP 协议支持
  - 多收件人支持
  - HTML 和纯文本格式
  - 附件支持

- 🚧 **Webhook 通知**：下一版本重点
  - HTTP/HTTPS 请求支持
  - 自定义请求头和方法
  - 常见平台预设（Discord、Teams）
  - 重试机制和错误处理

### 未来计划

- 📱 **移动端推送**：考虑中
- 🔔 **浏览器通知**：考虑中
- 📊 **通知统计和分析**：考虑中

## 支持的通知后端

### 1. 邮件 (Email) 🚧 开发中
- 通过SMTP发送邮件通知
- 支持多个收件人
- 可配置SMTP服务器

### 2. Webhook 🚧 开发中
- 发送HTTP请求到指定URL
- 支持自定义请求头和方法
- 内置常见平台格式（Slack、Discord、Teams）

### 3. Slack ❌ 暂不开发
- 通过Webhook发送Slack消息
- 支持富文本格式
- 可配置频道、用户名、图标
- **注意**：当前版本不计划开发此功能

### 4. MacOS系统通知 ✅ 已实现
- 发送原生MacOS桌面通知
- 支持标题、副标题和系统声音
- 无需额外配置，直接使用系统通知中心
- **注意**：通知持久性受macOS系统设置限制（详见下方说明）

### 5. 飞书通知 ✅ 已实现
- 通过飞书机器人Webhook发送消息到飞书群聊
- 支持文本消息、富文本消息和卡片消息
- 支持 @所有人、@指定用户（open_id）、@手机号
- 支持签名校验确保消息安全性
- 可配置多个群聊机器人（主群、开发群、测试群等）
- 完整的错误处理和发送状态反馈

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

**验证服务器状态：**
- 看到 "✅ Notice MCP Server 已启动，等待连接..." 表示启动成功
- 确认显示 "📋 可用工具: send_notification, get_backends"
- 如遇到连接问题，请检查配置文件路径和权限

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
- `backend` (string): 后端类型 (`email` | `webhook` | `slack` | `macos` | `feishu`)
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

### 飞书通知配置

```json
{
  "webhookUrl": "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_TOKEN",
  "secret": "your-bot-secret",
  "atAll": false,
  "atUsers": ["ou_xxx", "ou_yyy"],
  "atMobiles": ["+8613800138000"]
}
```

**飞书通知示例：**

```json
{
  "title": "AI任务完成",
  "message": "您的数据分析任务已完成，请查看结果",
  "backend": "feishu",
  "config": {
    "webhookUrl": "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_TOKEN",
    "atUsers": ["ou_xxx"]
  }
}
```

**MacOS通知示例：**

```json
{
  "title": "任务完成",
  "message": "您的AI模型训练已完成",
  "backend": "macos",
  "config": {
    "subtitle": "深度学习任务",
    "sound": "Hero",
    "timeout": false
  }
}
```

### ⚠️ macOS 通知系统限制说明

**通知持久性问题：**

macOS 通知的持久性主要由系统设置决定，而非代码中的 `timeout` 参数：

- **横幅（Banner）模式**：通知会在约 5 秒后自动消失，无法通过代码强制持久化
- **提醒（Alert）模式**：通知会一直显示直到用户手动关闭

**解决方案：**

1. **用户手动设置**：在「系统偏好设置 → 通知 → 终端」中将通知样式从「横幅」改为「提醒」
2. **代码设置**：确保在配置中设置 `timeout: false` 以请求持久通知

**为什么其他应用可以常驻？**

原生应用（如 App Store、Calendar）能实现常驻通知是因为：
- 使用 Apple 开发者证书进行代码签名
- 在 Info.plist 中设置 `NSUserNotificationAlertStyle` 为 `alert`
- 拥有系统级权限来强制设置通知样式

第三方工具（如 node-notifier、terminal-notifier）受到 macOS 安全限制，无法强制设置通知样式，必须依赖用户的系统设置。

**当前状态：**
- ✅ 通知功能正常工作
- ✅ 支持所有通知参数（标题、内容、声音等）
- ⚠️ 通知持久性取决于用户的系统设置
- 📋 返回的 `timeout: 5` 是 node-notifier 的默认显示值，实际行为由系统设置决定

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

## 在Trae AI中使用

要在 Trae AI 中使用此 MCP 服务器，请将以下配置添加到您的 Trae 配置文件中：

**配置文件位置：**
- **macOS**: `~/Library/Application Support/Trae/trae_config.json`
- **Windows**: `%APPDATA%\Trae\trae_config.json`

**配置内容：**
```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/NoticeMCP/start.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**重要提示：** 请将 `/path/to/your/NoticeMCP/start.js` 替换为您的实际项目路径。

**使用示例：**
配置完成后，您可以在 Trae AI 中使用以下方式发送通知：

- "发送一个MacOS通知，标题是'任务完成'，内容是'代码编译成功'"
- "发送邮件通知给admin@company.com，主题'系统警告'，内容'服务器负载过高'"
- "发送Slack消息到#general频道：'部署完成'"

详细配置指南请参考：[Trae AI 配置指南](./docs/TRAE_SETUP.md)

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

## 🔧 故障排除

### 常见问题

**1. MCP 连接错误 "ReferenceError: request is not defined"**
- ✅ **已修复**：此问题已在最新版本中解决
- 确保使用最新版本的 `start.js`
- 重启 MCP 服务器以应用修复

**2. Trae AI 无法连接到 MCP 服务器**
- 检查配置文件是否在正确位置：`~/Library/Application Support/Trae/trae_config.json`
- 确认工作目录路径正确
- 重启 Trae AI 应用程序

**3. MacOS 通知不显示**
- 检查系统偏好设置 > 通知 > 终端的通知权限
- 确保通知中心已启用
- 验证通知是否被系统拦截或静音

**4. MacOS 通知无法常驻（5秒后消失）**
- ✅ **这是正常行为**：macOS 默认使用横幅模式，通知会在 5 秒后消失
- 🔧 **解决方案**：在「系统偏好设置 → 通知 → 终端」中将通知样式改为「提醒」
- 📋 **技术原因**：第三方工具受 macOS 安全限制，无法强制设置通知样式
- ⚠️ **注意**：即使代码中设置 `timeout: false`，横幅模式仍会在 5 秒后消失

**5. 配置文件加载失败**
- 检查 `config.toml` 文件语法是否正确
- 验证文件路径和权限
- 查看服务器启动日志中的错误信息

### 测试连接

运行完整测试套件验证所有功能：

```bash
./run-tests.sh
```

## 📚 相关文档

- [AI 助手使用指南](./docs/AI_ASSISTANT_GUIDE.md) - 详细的 AI 集成说明
- [Trae AI 配置指南](./docs/TRAE_SETUP.md) - Trae AI MCP 配置
- [Claude Desktop 配置指南](./docs/CLAUDE_DESKTOP_SETUP.md) - Claude Desktop MCP 配置
- [TOML 配置指南](./docs/TOML_CONFIG_GUIDE.md) - 配置文件详解
- [部署指南](./docs/DEPLOYMENT.md) - 生产环境部署

## 许可证

MIT License