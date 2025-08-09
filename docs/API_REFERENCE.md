# 📚 NoticeMCP API 参考文档

## 🚀 核心集成说明

NoticeMCP 目前专注于两个核心通知后端的深度集成：

### 🔥 飞书集成实现

**技术架构**：
- 基于飞书 Webhook API 实现
- 支持签名验证确保安全性
- 采用 HTTP POST 请求发送消息
- 支持多种消息类型（文本、卡片、交互式消息）

**核心特性**：
- **@ 功能**：支持 @所有人 和 @特定用户
- **消息类型**：文本消息、富文本、卡片消息
- **错误重试**：自动重试机制，提高可靠性
- **签名验证**：支持 HMAC-SHA256 签名验证

**实现细节**：
```javascript
// 飞书消息发送核心逻辑
const payload = {
  msg_type: 'text',
  content: {
    text: message + (atAll ? ' <at user_id="all">所有人</at>' : '')
  }
};

// 签名计算
const timestamp = Date.now();
const signature = crypto.createHmac('sha256', secret)
  .update(`${timestamp}\n${secret}`)
  .digest('base64');
```

### 🍎 macOS 集成实现

**技术架构**：
- 基于 `node-notifier` 库实现
- 调用 macOS 原生通知中心 API
- 支持丰富的通知样式和交互

**核心特性**：
- **原生体验**：完全集成 macOS 通知中心
- **声音支持**：内置多种系统声音
- **交互功能**：支持点击跳转、按钮操作
- **样式定制**：图标、图片、副标题等

**实现细节**：
```javascript
// macOS 通知发送核心逻辑
const notificationOptions = {
  title: title,
  message: message,
  sound: config.sound || 'Glass',
  timeout: config.timeout || false,
  subtitle: config.subtitle,
  icon: config.icon,
  contentImage: config.contentImage,
  open: config.open,
  wait: config.wait || false,
  appName: config.appName || 'NoticeMCP'
};

notifier.notify(notificationOptions);
```

---

## 📋 目录

- [概述](#概述)
- [MCP 工具](#mcp-工具)
- [通知后端](#通知后端)
  - [飞书 (Feishu)](#飞书-feishu)
  - [macOS 通知](#macos-通知)
- [配置参数](#配置参数)
- [响应格式](#响应格式)
- [错误处理](#错误处理)
- [示例代码](#示例代码)

## 概述

NoticeMCP 通过 MCP (Model Context Protocol) 协议提供通知服务。所有的 API 调用都通过 MCP 工具接口进行。

### 基本调用格式

```javascript
const result = await callTool(toolName, parameters);
```

## MCP 工具

### send_notification

发送通知消息到所有启用的后端。

#### 工具定义

```json
{
  "name": "send_notification",
  "description": "发送通知消息到所有启用的后端",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "通知标题",
        "maxLength": 100
      },
      "message": {
        "type": "string",
        "description": "通知内容",
        "maxLength": 1000
      },
      "config": {
        "type": "object",
        "description": "后端特定配置（可选）",
        "properties": {
          "feishu": { "$ref": "#/definitions/FeishuConfig" },
          "macos": { "$ref": "#/definitions/MacOSConfig" }
        }
      }
    },
    "required": ["title", "message"]
  }
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 描述 | 限制 |
|------|------|------|------|------|
| `title` | string | ✅ | 通知标题 | 最大 100 字符 |
| `message` | string | ✅ | 通知内容 | 最大 1000 字符 |
| `config` | object | ❌ | 后端特定配置 | 见各后端配置 |

#### 基本使用

```javascript
// 最简单的调用
const result = await callTool('send_notification', {
  title: '任务完成',
  message: '数据处理任务已成功完成！'
});
```

#### 高级使用

```javascript
// 带配置的调用
const result = await callTool('send_notification', {
  title: '系统警告',
  message: '服务器负载过高，请及时处理',
  config: {
    feishu: {
      atAll: true,
      secret: 'your-secret-key'
    },
    macos: {
      sound: 'Hero',
      timeout: 10
    }
  }
});

```

## 通知后端

### 飞书 (Feishu)

#### 配置参数

```typescript
interface FeishuConfig {
  webhook_url?: string;           // Webhook URL
  secret?: string;                // 签名密钥
  atAll?: boolean;               // 是否 @ 所有人
  atMentionedUsers?: string[];   // @ 特定用户 ID 列表
  msgType?: 'text' | 'interactive' | 'image' | 'file';
  card?: object;                 // 卡片消息配置
  timeout?: number;              // 请求超时时间（毫秒）
  retries?: number;              // 重试次数
}
```

#### 参数详解

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `webhook_url` | string | 配置文件中的值 | 飞书机器人 Webhook URL |
| `secret` | string | 配置文件中的值 | 签名验证密钥 |
| `atAll` | boolean | false | 是否 @ 所有人 |
| `atMentionedUsers` | string[] | [] | @ 特定用户的 ID 列表 |
| `msgType` | string | 'text' | 消息类型 |
| `card` | object | null | 卡片消息配置 |
| `timeout` | number | 5000 | 请求超时时间 |
| `retries` | number | 3 | 失败重试次数 |

#### 使用示例

```javascript
// @ 所有人的紧急通知
const result = await callTool('send_notification', {
  title: '🚨 紧急维护通知',
  message: '系统将在 10 分钟后进行紧急维护，预计持续 30 分钟。',
  config: {
    feishu: {
      atAll: true,
      msgType: 'text'
    }
  }
});

// @ 特定用户
const result = await callTool('send_notification', {
  title: '任务分配',
  message: '新的开发任务已分配，请及时查看。',
  config: {
    feishu: {
      atMentionedUsers: ['ou_xxx', 'ou_yyy']
    }
  }
});

// 卡片消息
const result = await callTool('send_notification', {
  title: '项目状态更新',
  message: '项目进度报告',
  config: {
    feishu: {
      msgType: 'interactive',
      card: {
        config: {
          wide_screen_mode: true
        },
        elements: [
          {
            tag: 'div',
            text: {
              content: '**项目进度**: 75%\n**预计完成时间**: 2024-01-15',
              tag: 'lark_md'
            }
          }
        ]
      }
    }
  }
});
```

### macOS 通知

#### 配置参数

```typescript
interface MacOSConfig {
  sound?: string | boolean;       // 通知声音
  timeout?: number | boolean;     // 自动消失时间
  subtitle?: string;              // 副标题
  icon?: string;                  // 图标路径
  contentImage?: string;          // 内容图片路径
  open?: string;                  // 点击时打开的 URL
  wait?: boolean;                 // 是否等待用户交互
  appName?: string;               // 应用名称
  category?: string;              // 通知类别
}
```

#### 参数详解

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `sound` | string\|boolean | 'Glass' | 通知声音名称或 false 禁用 |
| `timeout` | number\|boolean | false | 自动消失时间（秒）或 false 不消失 |
| `subtitle` | string | null | 通知副标题 |
| `icon` | string | null | 自定义图标路径 |
| `contentImage` | string | null | 内容图片路径 |
| `open` | string | null | 点击通知时打开的 URL |
| `wait` | boolean | false | 是否等待用户交互 |
| `appName` | string | 'NoticeMCP' | 显示的应用名称 |
| `category` | string | null | 通知类别 |

#### 可用声音

- `Basso`
- `Blow`
- `Bottle`
- `Frog`
- `Funk`
- `Glass` (默认)
- `Hero`
- `Morse`
- `Ping`
- `Pop`
- `Purr`
- `Sosumi`
- `Submarine`
- `Tink`

#### 使用示例

```javascript
// 带声音的通知
const result = await callTool('send_notification', {
  title: '构建完成',
  message: '项目构建成功完成',
  config: {
    macos: {
      sound: 'Hero',
      subtitle: '构建系统'
    }
  }
});

// 静音通知
const result = await callTool('send_notification', {
  title: '后台任务',
  message: '数据同步正在进行中...',
  config: {
    macos: {
      sound: false
    }
  }
});

// 自动消失通知
const result = await callTool('send_notification', {
  title: '临时提醒',
  message: '这是一个临时提醒消息',
  config: {
    macos: {
      timeout: 5,  // 5秒后自动消失
      sound: 'Glass'
    }
  }
});

// 可点击通知
const result = await callTool('send_notification', {
  title: '新消息',
  message: '点击查看详情',
  config: {
    macos: {
      open: 'https://example.com/message',
      sound: 'Ping'
    }
  }
});
```

## 配置参数

### 全局配置

#### 后端启用/禁用

```javascript
// 只启用特定后端
const result = await callTool('send_notification', {
  title: '测试通知',
  message: '只发送到飞书',
  config: {
    backends: ['feishu']  // 只启用飞书后端
  }
});

// 禁用特定后端
const result = await callTool('send_notification', {
  title: '测试通知',
  message: '不发送到 macOS',
  config: {
    excludeBackends: ['macos']  // 排除 macOS 后端
  }
});
```

#### 调试配置

```javascript
// 启用调试模式
const result = await callTool('send_notification', {
  title: '调试测试',
  message: '这是调试消息',
  config: {
    debug: true,           // 启用调试输出
    dryRun: true          // 只模拟发送，不实际发送
  }
});
```

## 响应格式

### 成功响应

```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"success\": true,\n  \"results\": {\n    \"feishu\": {\n      \"success\": true,\n      \"messageId\": \"msg_xxx\",\n      \"timestamp\": \"2024-01-01T12:00:00Z\"\n    },\n    \"macos\": {\n      \"success\": true,\n      \"timestamp\": \"2024-01-01T12:00:00Z\"\n    }\n  },\n  \"summary\": {\n    \"total\": 2,\n    \"successful\": 2,\n    \"failed\": 0\n  }\n}"
  }]
}
```

### 部分失败响应

```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"success\": false,\n  \"results\": {\n    \"feishu\": {\n      \"success\": true,\n      \"messageId\": \"msg_xxx\"\n    },\n    \"macos\": {\n      \"success\": false,\n      \"error\": \"通知发送失败: 权限不足\"\n    }\n  },\n  \"summary\": {\n    \"total\": 2,\n    \"successful\": 1,\n    \"failed\": 1\n  }\n}"
  }]
}
```

### 响应字段说明

| 字段 | 类型 | 描述 |
|------|------|------|
| `success` | boolean | 整体是否成功（所有后端都成功） |
| `results` | object | 各后端的详细结果 |
| `results[backend].success` | boolean | 该后端是否成功 |
| `results[backend].messageId` | string | 消息 ID（如果支持） |
| `results[backend].error` | string | 错误信息（如果失败） |
| `results[backend].timestamp` | string | 发送时间戳 |
| `summary.total` | number | 总后端数量 |
| `summary.successful` | number | 成功的后端数量 |
| `summary.failed` | number | 失败的后端数量 |

## 错误处理

### 错误类型

#### 1. 参数验证错误

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "参数验证失败",
    "details": {
      "field": "title",
      "reason": "标题长度不能超过 100 字符"
    }
  }
}
```

#### 2. 配置错误

```json
{
  "error": {
    "code": "CONFIG_ERROR",
    "message": "配置文件错误",
    "details": {
      "backend": "feishu",
      "reason": "缺少 webhook_url 配置"
    }
  }
}
```

#### 3. 网络错误

```json
{
  "error": {
    "code": "NETWORK_ERROR",
    "message": "网络请求失败",
    "details": {
      "backend": "feishu",
      "reason": "连接超时",
      "retries": 3
    }
  }
}
```

#### 4. 后端特定错误

```json
{
  "error": {
    "code": "BACKEND_ERROR",
    "message": "后端服务错误",
    "details": {
      "backend": "feishu",
      "httpStatus": 400,
      "reason": "invalid webhook url"
    }
  }
}
```

### 错误处理最佳实践

```javascript
try {
  const result = await callTool('send_notification', {
    title: '测试通知',
    message: '这是一条测试消息'
  });
  
  // 解析结果
  const response = JSON.parse(result.content[0].text);
  
  if (response.success) {
    console.log('所有通知发送成功');
  } else {
    console.log(`部分通知失败: ${response.summary.failed}/${response.summary.total}`);
    
    // 检查具体失败的后端
    for (const [backend, result] of Object.entries(response.results)) {
      if (!result.success) {
        console.error(`${backend} 发送失败: ${result.error}`);
      }
    }
  }
} catch (error) {
  console.error('通知发送异常:', error.message);
  
  // 根据错误类型进行处理
  if (error.code === 'INVALID_PARAMETERS') {
    // 参数错误，修正参数后重试
  } else if (error.code === 'NETWORK_ERROR') {
    // 网络错误，稍后重试
  } else {
    // 其他错误，记录日志
  }
}
```

## 示例代码

### 完整的通知发送示例

```javascript
/**
 * 发送多级别通知
 * @param {string} level - 通知级别: 'info', 'warning', 'error', 'critical'
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 * @param {object} options - 额外选项
 */
async function sendLeveledNotification(level, title, message, options = {}) {
  const config = {
    debug: options.debug || false
  };
  
  // 根据级别配置不同的后端参数
  switch (level) {
    case 'critical':
      config.feishu = {
        atAll: true,
        msgType: 'text'
      };
      config.macos = {
        sound: 'Sosumi',
        timeout: false  // 不自动消失
      };
      break;
      
    case 'error':
      config.feishu = {
        atMentionedUsers: options.mentionUsers || []
      };
      config.macos = {
        sound: 'Hero'
      };
      break;
      
    case 'warning':
      config.macos = {
        sound: 'Glass'
      };
      break;
      
    case 'info':
    default:
      config.macos = {
        sound: false  // 静音
      };
      break;
  }
  
  // 添加级别前缀
  const levelEmojis = {
    critical: '🚨',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const finalTitle = `${levelEmojis[level] || ''} [${level.toUpperCase()}] ${title}`;
  
  try {
    const result = await callTool('send_notification', {
      title: finalTitle,
      message: message,
      config: config
    });
    
    const response = JSON.parse(result.content[0].text);
    
    return {
      success: response.success,
      summary: response.summary,
      results: response.results
    };
  } catch (error) {
    console.error('通知发送失败:', error);
    throw error;
  }
}

// 使用示例

// 信息通知
await sendLeveledNotification('info', '任务完成', '数据处理任务已完成');

// 警告通知
await sendLeveledNotification('warning', 'CPU 使用率高', 'CPU 使用率达到 85%');

// 错误通知
await sendLeveledNotification('error', '服务异常', '用户服务响应超时', {
  mentionUsers: ['ou_xxx', 'ou_yyy']
});

// 紧急通知
await sendLeveledNotification('critical', '系统故障', '数据库连接完全失败', {
  debug: true
});
```

### 批量通知管理器

```javascript
class NotificationManager {
  constructor(options = {}) {
    this.defaultConfig = options.defaultConfig || {};
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }
  
  /**
   * 发送单个通知
   */
  async send(title, message, config = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await callTool('send_notification', {
          title,
          message,
          config: finalConfig
        });
        
        return JSON.parse(result.content[0].text);
      } catch (error) {
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        console.warn(`通知发送失败，第 ${attempt} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }
  
  /**
   * 批量发送通知
   */
  async sendBatch(notifications) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        const result = await this.send(
          notification.title,
          notification.message,
          notification.config
        );
        
        results.push({
          success: true,
          notification,
          result
        });
      } catch (error) {
        results.push({
          success: false,
          notification,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * 发送模板通知
   */
  async sendTemplate(templateName, variables, config = {}) {
    const templates = {
      deployment: {
        title: '🚀 部署通知',
        message: '项目 {{project}} 已部署到 {{environment}} 环境\n版本: {{version}}\n时间: {{timestamp}}'
      },
      monitoring: {
        title: '📊 监控警告',
        message: '服务 {{service}} 出现异常\n指标: {{metric}}\n当前值: {{value}}\n阈值: {{threshold}}'
      },
      backup: {
        title: '💾 备份通知',
        message: '数据库 {{database}} 备份{{status}}\n大小: {{size}}\n耗时: {{duration}}'
      }
    };
    
    const template = templates[templateName];
    if (!template) {
      throw new Error(`未知的模板: ${templateName}`);
    }
    
    // 替换变量
    let title = template.title;
    let message = template.message;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regex, value);
      message = message.replace(regex, value);
    }
    
    return await this.send(title, message, config);
  }
}

// 使用示例
const notifier = new NotificationManager({
  defaultConfig: {
    macos: { sound: 'Glass' },
    feishu: { msgType: 'text' }
  },
  retryAttempts: 3,
  retryDelay: 1000
});

// 发送模板通知
await notifier.sendTemplate('deployment', {
  project: 'MyApp',
  environment: 'production',
  version: 'v1.2.3',
  timestamp: new Date().toLocaleString()
});

// 批量发送
const notifications = [
  {
    title: '任务 1 完成',
    message: '数据导入完成',
    config: { macos: { sound: false } }
  },
  {
    title: '任务 2 完成',
    message: '报告生成完成'
  }
];

const results = await notifier.sendBatch(notifications);
console.log(`批量发送完成: ${results.filter(r => r.success).length}/${results.length} 成功`);
```

---

## 📚 相关文档

- [架构文档](./ARCHITECTURE.md)
- [使用指南](./USAGE_GUIDE.md)
- [配置文档](./TOML_CONFIG_GUIDE.md)
- [部署指南](./DEPLOYMENT.md)

---

💡 **提示**: 这个 API 参考文档详细说明了所有可用的工具、参数和配置选项。建议结合使用指南一起阅读，以获得最佳的使用体验。