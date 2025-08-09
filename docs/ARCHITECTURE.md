# 🏗️ NoticeMCP 架构文档

## 📋 目录

- [项目概述](#项目概述)
- [核心架构](#核心架构)
- [代码结构](#代码结构)
- [核心组件](#核心组件)
- [数据流程](#数据流程)
- [配置系统](#配置系统)
- [后端支持](#后端支持)
- [MCP协议实现](#mcp协议实现)
- [使用方法](#使用方法)
- [扩展开发](#扩展开发)

## 项目概述

NoticeMCP 是一个基于 MCP (Model Context Protocol) 的通知服务器，支持多种通知后端（飞书、macOS、邮件、Slack、Webhook等）。它作为 AI 助手的工具，允许 AI 通过统一的接口发送通知到不同的平台。

### 核心特性

- 🔌 **MCP协议支持**: 完全兼容 MCP 标准
- 🎯 **多后端支持**: 飞书、macOS、邮件、Slack、Webhook
- ⚙️ **灵活配置**: TOML 配置文件，支持动态配置
- 🛠️ **调试模式**: 内置调试工具和详细日志
- 🔒 **安全性**: 支持签名验证和访问控制
- 📊 **监控**: 内置性能监控和错误处理

## 核心架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Assistant  │───▶│   MCP Client    │───▶│  NoticeMCP      │
│  (Trae/Claude)  │    │   (Transport)   │    │   Server        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ Config Manager  │
                                               └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     飞书        │    │     macOS       │    │     邮件        │
│   (Webhook)     │◀───│  (Notification) │◀───│    (SMTP)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│     Slack       │    │    Webhook      │
│    (API)        │◀───│   (HTTP)        │
└─────────────────┘    └─────────────────┘
```

## 代码结构

```
NoticeMCP/
├── start.js                 # 主入口文件
├── config.toml             # 配置文件
├── src/                    # TypeScript 源码（未来迁移）
│   ├── backends/           # 后端实现
│   ├── config/            # 配置管理
│   ├── notification/      # 通知管理
│   └── index.ts           # TypeScript 入口
├── docs/                  # 文档目录
├── tests/                 # 测试文件
├── spikes/               # 实验性代码
└── mcp_settings/         # MCP 配置文件
```

## 核心组件

### 1. SimpleMCPServer 类

主服务器类，负责处理 MCP 协议和工具调用。

```javascript
class SimpleMCPServer {
  constructor(configManager = null) {
    this.configManager = configManager;
    this.tools = [
      {
        name: 'send_notification',
        description: '发送通知消息到所有启用的后端',
        inputSchema: { /* ... */ }
      }
    ];
  }

  // 核心方法
  async sendNotification(args)     // 发送通知
  getAvailableBackends()           // 获取可用后端
  isDebugMode()                   // 检查调试模式
  async handleToolCall(params)    // 处理工具调用
}
```

### 2. ConfigManager 类

配置管理器，负责读取和解析 TOML 配置文件。

```javascript
class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
  }

  loadConfig()                    // 加载配置文件
  getConfig()                     // 获取完整配置
  getBackendConfig(backend)       // 获取特定后端配置
  isBackendEnabled(backend)       // 检查后端是否启用
}
```

### 3. StdioMCPTransport 类

标准输入输出传输层，实现 MCP 协议的通信。

```javascript
class StdioMCPTransport {
  constructor(server) {
    this.server = server;
    this.setupStdio();
  }

  setupStdio()                    // 设置标准输入输出
  async handleMessage(message)    // 处理 MCP 消息
}
```

## 数据流程

### 通知发送流程

```
1. AI Assistant 调用 send_notification 工具
   ↓
2. MCP Client 发送 JSON-RPC 请求
   ↓
3. StdioMCPTransport 接收并解析请求
   ↓
4. SimpleMCPServer.handleToolCall() 处理请求
   ↓
5. SimpleMCPServer.sendNotification() 执行通知逻辑
   ↓
6. getAvailableBackends() 获取启用的后端列表
   ↓
7. 遍历每个后端，调用对应的发送方法
   ├── sendFeishu()     # 飞书通知
   ├── sendMacOS()      # macOS 通知
   ├── sendEmail()      # 邮件通知
   ├── sendSlack()      # Slack 通知
   └── sendWebhook()    # Webhook 通知
   ↓
8. 收集所有结果，返回统一响应
   ↓
9. 通过 MCP 协议返回给 AI Assistant
```

### 配置加载流程

```
1. 服务器启动时调用 loadConfig()
   ↓
2. 检查 config.toml 文件是否存在
   ↓
3. 使用 @iarna/toml 解析配置文件
   ↓
4. 创建 ConfigManager 实例
   ↓
5. 传递给 SimpleMCPServer 构造函数
   ↓
6. 服务器根据配置初始化后端
```

## 配置系统

### 配置文件结构

```toml
[backends.feishu]
enabled = true
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/xxx"

[backends.macos]
enabled = false
default_sound = "Glass"

[backends.email]
enabled = false
[backends.email.smtp]
host = "smtp.example.com"
port = 587

[development]
debug_mode = false
verbose_logging = false

[security]
allowed_ips = ["127.0.0.1", "::1"]
require_https = false
```

### 配置优先级

1. **运行时配置**: 通过工具调用传递的配置参数
2. **后端配置**: config.toml 中的后端特定配置
3. **默认配置**: 代码中的硬编码默认值

## 后端支持

### 1. 飞书后端 (Feishu)

```javascript
async sendFeishu(title, message, config = {}) {
  const webhookUrl = config.webhook_url;
  const payload = {
    msg_type: 'text',
    content: { text: `**${title}**\n\n${message}` }
  };
  
  // 支持 @ 功能
  if (config.atAll) {
    payload.content.text += '\n\n<at user_id="all">所有人</at>';
  }
  
  // 支持签名验证
  if (config.secret) {
    // 添加时间戳和签名
  }
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
```

### 2. macOS 后端

```javascript
async sendMacOS(title, message, config = {}) {
  const nodeNotifier = await import('node-notifier');
  const notifier = nodeNotifier.default;
  
  const options = {
    title: title,
    message: message,
    sound: config.sound || true,
    timeout: config.timeout !== undefined ? config.timeout : false
  };
  
  await new Promise((resolve, reject) => {
    notifier.notify(options, (err, response) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
```

### 3. 其他后端

- **邮件**: 使用 SMTP 协议发送邮件
- **Slack**: 使用 Slack Web API
- **Webhook**: 发送 HTTP POST 请求到指定 URL

## MCP协议实现

### 工具定义

```javascript
const tools = [
  {
    name: 'send_notification',
    description: '发送通知消息到所有启用的后端',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '通知标题'
        },
        message: {
          type: 'string',
          description: '通知内容'
        },
        config: {
          type: 'object',
          description: '后端特定配置（可选）'
        }
      },
      required: ['title', 'message']
    }
  }
];
```

### 消息处理

```javascript
async handleMessage(message) {
  const { method, params, id } = message;
  
  switch (method) {
    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: this.server.tools }
      };
      
    case 'tools/call':
      const result = await this.server.handleToolCall(params);
      return {
        jsonrpc: '2.0',
        id,
        result
      };
      
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}
```

## 使用方法

### 1. 基本使用

```javascript
// AI Assistant 中调用
const result = await callTool('send_notification', {
  title: '测试通知',
  message: '这是一条测试消息'
});
```

### 2. 高级配置

```javascript
// 带配置的通知
const result = await callTool('send_notification', {
  title: '重要通知',
  message: '系统维护通知',
  config: {
    atAll: true,           // 飞书 @ 所有人
    sound: 'Hero',         // macOS 通知声音
    priority: 'high'       // 邮件优先级
  }
});
```

### 3. 批量通知

```javascript
// 发送到多个后端
const backends = ['feishu', 'email', 'slack'];
for (const backend of backends) {
  await callTool('send_notification', {
    title: `通知 - ${backend}`,
    message: '多后端通知测试',
    config: { backend: backend }
  });
}
```

## 扩展开发

### 添加新后端

1. **实现发送方法**:

```javascript
async sendNewBackend(title, message, config = {}) {
  // 实现具体的发送逻辑
  try {
    // 发送通知的代码
    return {
      messageId: `new-backend-${Date.now()}`,
      // 其他返回信息
    };
  } catch (error) {
    throw new Error(`新后端通知发送失败: ${error.message}`);
  }
}
```

2. **更新后端列表**:

```javascript
getAvailableBackends() {
  // 添加新后端的检查逻辑
  if (config.backends.newBackend && config.backends.newBackend.enabled) {
    backends.push('newBackend');
  }
}
```

3. **更新发送逻辑**:

```javascript
switch (backend) {
  case 'newBackend':
    result = await this.sendNewBackend(title, message, finalConfig);
    break;
  // 其他 case...
}
```

### 添加新工具

1. **定义工具**:

```javascript
const newTool = {
  name: 'new_tool',
  description: '新工具描述',
  inputSchema: {
    type: 'object',
    properties: {
      // 参数定义
    },
    required: ['param1']
  }
};
```

2. **实现处理方法**:

```javascript
async handleNewTool(args) {
  // 实现工具逻辑
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}
```

3. **注册工具**:

```javascript
const tools = [
  // 现有工具...
  newTool
];
```

### 调试和测试

1. **启用调试模式**:

```toml
[development]
debug_mode = true
verbose_logging = true
```

2. **查看调试日志**:

```bash
node start.js
# 查看详细的调试输出
```

3. **运行测试**:

```bash
# 运行单元测试
npm test

# 运行集成测试
node tests/integration.test.js
```

---

## 📚 相关文档

- [使用指南](./README.md)
- [配置文档](./TOML_CONFIG_GUIDE.md)
- [部署指南](./DEPLOYMENT.md)
- [Trae AI 配置](./TRAE_SETUP.md)
- [Claude Desktop 配置](./CLAUDE_DESKTOP_SETUP.md)

---

💡 **提示**: 这个架构文档详细说明了 NoticeMCP 的内部工作原理。如果你需要扩展功能或进行深度定制，请参考相应的章节。