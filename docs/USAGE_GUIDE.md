# 📖 NoticeMCP 使用指南

## 📋 目录

- [快速开始](#快速开始)
- [基本使用](#基本使用)
- [高级功能](#高级功能)
- [后端配置](#后端配置)
- [实用示例](#实用示例)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

## 快速开始

### 1. 安装和配置

```bash
# 克隆项目
git clone <repository-url>
cd NoticeMCP

# 安装依赖
npm install

# 复制配置文件模板
cp config.toml.example config.toml

# 编辑配置文件
vim config.toml
```

### 2. 启动服务

```bash
# 启动 MCP 服务器
node start.js

# 或者在调试模式下启动
DEBUG=true node start.js
```

### 3. 连接到 AI 助手

#### Trae AI 配置

在 Trae AI 中添加 MCP 服务器：

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

#### Claude Desktop 配置

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

## 基本使用

### 发送简单通知

```javascript
// 在 AI 助手中调用
const result = await callTool('send_notification', {
  title: '任务完成',
  message: '数据处理任务已成功完成！'
});
```

### 查看通知结果

```javascript
// 返回结果示例
{
  "content": [{
    "type": "text",
    "text": "{\n  \"success\": true,\n  \"results\": {\n    \"feishu\": {\n      \"success\": true,\n      \"messageId\": \"msg_xxx\"\n    }\n  }\n}"
  }]
}
```

## 高级功能

### 1. 多后端通知

```javascript
// 同时发送到多个平台
const result = await callTool('send_notification', {
  title: '系统警告',
  message: '服务器 CPU 使用率超过 90%',
  config: {
    // 飞书配置
    feishu: {
      atAll: true,
      secret: 'your-secret-key'
    },
    // macOS 配置
    macos: {
      sound: 'Hero',
      timeout: 10
    },
    // 邮件配置
    email: {
      priority: 'high',
      to: ['admin@company.com']
    }
  }
});
```

### 2. 条件通知

```javascript
// 根据条件发送不同类型的通知
function sendConditionalNotification(level, title, message) {
  const config = {};
  
  switch (level) {
    case 'critical':
      config.feishu = { atAll: true };
      config.macos = { sound: 'Sosumi' };
      config.email = { priority: 'high' };
      break;
    case 'warning':
      config.feishu = { atMentionedUsers: ['user1', 'user2'] };
      config.macos = { sound: 'Glass' };
      break;
    case 'info':
      config.macos = { sound: false };
      break;
  }
  
  return callTool('send_notification', {
    title: `[${level.toUpperCase()}] ${title}`,
    message,
    config
  });
}

// 使用示例
await sendConditionalNotification('critical', '数据库连接失败', '无法连接到主数据库服务器');
```

### 3. 批量通知

```javascript
// 批量发送通知
async function sendBatchNotifications(notifications) {
  const results = [];
  
  for (const notification of notifications) {
    try {
      const result = await callTool('send_notification', notification);
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
}

// 使用示例
const notifications = [
  {
    title: '任务 1 完成',
    message: '数据导入任务已完成'
  },
  {
    title: '任务 2 完成',
    message: '报告生成任务已完成'
  }
];

const results = await sendBatchNotifications(notifications);
```

## 后端配置

### 1. 飞书 (Feishu) 配置

#### 基本配置

```toml
[backends.feishu]
enabled = true
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
```

#### 高级配置

```toml
[backends.feishu]
enabled = true
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/xxx"
secret = "your-secret-key"  # 签名验证
default_at_all = false      # 默认不 @ 所有人
max_retries = 3             # 最大重试次数
timeout = 5000              # 超时时间（毫秒）
```

#### 使用示例

```javascript
// @ 所有人
const result = await callTool('send_notification', {
  title: '紧急通知',
  message: '系统将在 10 分钟后维护',
  config: {
    feishu: {
      atAll: true
    }
  }
});

// @ 特定用户
const result = await callTool('send_notification', {
  title: '任务分配',
  message: '请查看新的任务分配',
  config: {
    feishu: {
      atMentionedUsers: ['user_id_1', 'user_id_2']
    }
  }
});

// 富文本消息
const result = await callTool('send_notification', {
  title: '项目进度',
  message: '项目进度更新',
  config: {
    feishu: {
      msgType: 'interactive',
      card: {
        // 飞书卡片消息配置
      }
    }
  }
});
```

### 2. macOS 通知配置

#### 基本配置

```toml
[backends.macos]
enabled = true
default_sound = "Glass"
```

#### 高级配置

```toml
[backends.macos]
enabled = true
default_sound = "Glass"
default_timeout = false     # 不自动消失
app_name = "NoticeMCP"      # 应用名称
app_icon = "/path/to/icon.png"  # 应用图标
```

#### 使用示例

```javascript
// 自定义声音
const result = await callTool('send_notification', {
  title: '构建完成',
  message: '项目构建成功完成',
  config: {
    macos: {
      sound: 'Hero'  // 可选: Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink
    }
  }
});

// 静音通知
const result = await callTool('send_notification', {
  title: '后台任务',
  message: '数据同步正在进行中',
  config: {
    macos: {
      sound: false
    }
  }
});

// 自动消失通知
const result = await callTool('send_notification', {
  title: '临时提醒',
  message: '这条通知将在 5 秒后消失',
  config: {
    macos: {
      timeout: 5
    }
  }
});
```

### 3. 邮件配置

#### 基本配置

```toml
[backends.email]
enabled = true
[backends.email.smtp]
host = "smtp.gmail.com"
port = 587
secure = false
user = "your-email@gmail.com"
pass = "your-app-password"
[backends.email.defaults]
from = "NoticeMCP <your-email@gmail.com>"
to = ["admin@company.com"]
```

#### 使用示例

```javascript
// 发送邮件通知
const result = await callTool('send_notification', {
  title: '系统报告',
  message: '每日系统状态报告已生成',
  config: {
    email: {
      to: ['manager@company.com', 'team@company.com'],
      cc: ['backup@company.com'],
      priority: 'high',
      attachments: [
        {
          filename: 'report.pdf',
          path: '/path/to/report.pdf'
        }
      ]
    }
  }
});
```

### 4. Slack 配置

#### 基本配置

```toml
[backends.slack]
enabled = true
bot_token = "xoxb-your-bot-token"
default_channel = "#general"
```

#### 使用示例

```javascript
// 发送到特定频道
const result = await callTool('send_notification', {
  title: '部署完成',
  message: '生产环境部署已完成',
  config: {
    slack: {
      channel: '#deployments',
      username: 'DeployBot',
      icon_emoji: ':rocket:'
    }
  }
});

// 发送私信
const result = await callTool('send_notification', {
  title: '个人提醒',
  message: '你有新的任务分配',
  config: {
    slack: {
      channel: '@username'
    }
  }
});
```

### 5. Webhook 配置

#### 基本配置

```toml
[backends.webhook]
enabled = true
url = "https://your-webhook-endpoint.com/notify"
method = "POST"
```

#### 使用示例

```javascript
// 自定义 Webhook 请求
const result = await callTool('send_notification', {
  title: '自定义事件',
  message: '触发了自定义事件',
  config: {
    webhook: {
      url: 'https://api.example.com/notifications',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-token',
        'Content-Type': 'application/json'
      },
      payload: {
        event: 'custom_notification',
        timestamp: new Date().toISOString(),
        data: {
          title: '{{title}}',
          message: '{{message}}'
        }
      }
    }
  }
});
```

## 实用示例

### 1. 监控脚本集成

```javascript
// 系统监控脚本
class SystemMonitor {
  async checkCPU() {
    const cpuUsage = await getCPUUsage();
    
    if (cpuUsage > 90) {
      await callTool('send_notification', {
        title: '🚨 CPU 使用率警告',
        message: `当前 CPU 使用率: ${cpuUsage}%`,
        config: {
          feishu: { atAll: true },
          macos: { sound: 'Sosumi' }
        }
      });
    }
  }
  
  async checkDisk() {
    const diskUsage = await getDiskUsage();
    
    if (diskUsage > 85) {
      await callTool('send_notification', {
        title: '💾 磁盘空间警告',
        message: `磁盘使用率: ${diskUsage}%`,
        config: {
          email: {
            priority: 'high',
            to: ['admin@company.com']
          }
        }
      });
    }
  }
}
```

### 2. CI/CD 集成

```javascript
// GitHub Actions 集成
class CINotifier {
  async notifyBuildStart(branch, commit) {
    await callTool('send_notification', {
      title: '🔨 构建开始',
      message: `分支: ${branch}\n提交: ${commit}`,
      config: {
        slack: {
          channel: '#ci-cd',
          username: 'BuildBot'
        }
      }
    });
  }
  
  async notifyBuildSuccess(branch, buildTime) {
    await callTool('send_notification', {
      title: '✅ 构建成功',
      message: `分支: ${branch}\n构建时间: ${buildTime}`,
      config: {
        feishu: {
          msgType: 'interactive',
          card: {
            // 成功卡片样式
          }
        }
      }
    });
  }
  
  async notifyBuildFailure(branch, error) {
    await callTool('send_notification', {
      title: '❌ 构建失败',
      message: `分支: ${branch}\n错误: ${error}`,
      config: {
        feishu: { atAll: true },
        email: {
          priority: 'high',
          to: ['dev-team@company.com']
        }
      }
    });
  }
}
```

### 3. 任务调度集成

```javascript
// 定时任务通知
class TaskScheduler {
  async scheduleTask(taskName, schedule) {
    // 使用 node-cron 或其他调度器
    cron.schedule(schedule, async () => {
      try {
        await this.executeTask(taskName);
        
        await callTool('send_notification', {
          title: `📋 任务完成: ${taskName}`,
          message: `定时任务 ${taskName} 执行成功`,
          config: {
            macos: { sound: 'Glass' }
          }
        });
      } catch (error) {
        await callTool('send_notification', {
          title: `❌ 任务失败: ${taskName}`,
          message: `错误信息: ${error.message}`,
          config: {
            feishu: { atAll: true },
            macos: { sound: 'Sosumi' }
          }
        });
      }
    });
  }
}
```

## 故障排除

### 常见问题

#### 1. 通知发送失败

**问题**: 通知发送失败，返回错误信息

**解决方案**:

```bash
# 检查配置文件
cat config.toml

# 启用调试模式
DEBUG=true node start.js

# 检查网络连接
curl -X POST https://open.feishu.cn/open-apis/bot/v2/hook/xxx
```

#### 2. MCP 连接问题

**问题**: AI 助手无法连接到 MCP 服务器

**解决方案**:

```bash
# 检查服务器是否运行
ps aux | grep "node start.js"

# 检查端口占用
lsof -i :3000

# 重启服务器
pkill -f "node start.js"
node start.js
```

#### 3. 配置文件问题

**问题**: 配置文件解析错误

**解决方案**:

```bash
# 验证 TOML 语法
npx toml-lint config.toml

# 检查文件权限
ls -la config.toml

# 重新生成配置文件
cp config.toml.example config.toml
```

### 调试技巧

#### 1. 启用详细日志

```toml
[development]
debug_mode = true
verbose_logging = true
```

#### 2. 测试单个后端

```javascript
// 只测试飞书后端
const result = await callTool('send_notification', {
  title: '测试',
  message: '飞书后端测试',
  config: {
    backends: ['feishu']  // 只启用飞书
  }
});
```

#### 3. 查看详细错误信息

```javascript
try {
  const result = await callTool('send_notification', {
    title: '测试',
    message: '测试消息'
  });
  console.log('成功:', result);
} catch (error) {
  console.error('错误详情:', error);
  console.error('错误堆栈:', error.stack);
}
```

## 最佳实践

### 1. 配置管理

- **环境分离**: 为不同环境使用不同的配置文件
- **敏感信息**: 使用环境变量存储敏感信息
- **配置验证**: 启动时验证配置的完整性

```bash
# 使用环境变量
export FEISHU_WEBHOOK_URL="https://..."
export EMAIL_PASSWORD="..."

# 环境特定配置
cp config.production.toml config.toml
```

### 2. 错误处理

- **重试机制**: 为网络请求添加重试逻辑
- **降级策略**: 主要后端失败时使用备用后端
- **错误监控**: 记录和监控错误发生情况

```javascript
// 带重试的通知发送
async function sendNotificationWithRetry(notification, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callTool('send_notification', notification);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 3. 性能优化

- **批量处理**: 合并多个通知为一次发送
- **异步处理**: 使用异步方式发送通知
- **缓存配置**: 缓存配置信息避免重复读取

```javascript
// 批量通知优化
class NotificationBatcher {
  constructor(batchSize = 10, flushInterval = 5000) {
    this.batch = [];
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.startFlushTimer();
  }
  
  add(notification) {
    this.batch.push(notification);
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.batch.length === 0) return;
    
    const notifications = this.batch.splice(0);
    await this.sendBatch(notifications);
  }
}
```

### 4. 安全考虑

- **访问控制**: 限制 MCP 服务器的访问权限
- **输入验证**: 验证通知内容的安全性
- **日志脱敏**: 避免在日志中记录敏感信息

```javascript
// 输入验证
function validateNotification(notification) {
  const { title, message } = notification;
  
  // 长度限制
  if (title.length > 100) {
    throw new Error('标题长度不能超过 100 字符');
  }
  
  if (message.length > 1000) {
    throw new Error('消息长度不能超过 1000 字符');
  }
  
  // 内容过滤
  const forbiddenPatterns = [/password/i, /secret/i, /token/i];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(title) || pattern.test(message)) {
      throw new Error('通知内容包含敏感信息');
    }
  }
}
```

---

## 📚 相关文档

- [架构文档](./ARCHITECTURE.md)
- [配置文档](./TOML_CONFIG_GUIDE.md)
- [部署指南](./DEPLOYMENT.md)
- [API 参考](./API_REFERENCE.md)

---

💡 **提示**: 这个使用指南涵盖了 NoticeMCP 的所有主要功能。如果你遇到问题或需要更多帮助，请查看故障排除章节或联系技术支持。