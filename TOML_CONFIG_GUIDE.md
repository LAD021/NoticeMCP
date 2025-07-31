# TOML配置管理指南

## 概述

Notice MCP Server 现在支持使用 TOML 配置文件来管理所有通知后端的配置。这使得配置管理更加灵活和可维护。

## 配置文件位置

配置文件应放置在项目根目录下，命名为 `config.toml`。

## 配置文件结构

### 服务器配置

```toml
[server]
name = "Notice MCP Server"
version = "1.0.0"
port = 3000
debug = false
```

### 日志配置

```toml
[logging]
level = "info"  # debug, info, warn, error
file = "notice.log"
enable_console = true
```

### 后端配置

#### 邮件后端

```toml
[backends.email]
enabled = true
default_from = "noreply@yourapp.com"
default_subject = "通知来自 Notice MCP"

[backends.email.smtp]
host = "smtp.gmail.com"
port = 587
secure = false
user = "your-email@gmail.com"  # 可通过环境变量 EMAIL_USER 设置
pass = "your-app-password"     # 可通过环境变量 EMAIL_PASS 设置

[backends.email.recipients]
default = ["admin@yourapp.com"]
admin = ["admin@yourapp.com", "dev@yourapp.com"]
dev = ["dev@yourapp.com"]
```

#### Webhook后端

```toml
[backends.webhook]
enabled = true
default_method = "POST"
timeout = 5000
retry_count = 3
retry_delay = 1000

[backends.webhook.endpoints]
default = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
alerts = "https://your-app.com/api/alerts"

[backends.webhook.headers]
"Content-Type" = "application/json"
"User-Agent" = "Notice-MCP-Server/1.0"
"Authorization" = "Bearer your-token"
```

#### Slack后端

```toml
[backends.slack]
enabled = true
default_channel = "#general"
default_username = "Notice Bot"
default_icon_emoji = ":bell:"
default_icon_url = ""

[backends.slack.workspaces]
default = "xoxb-your-slack-bot-token"  # 可通过环境变量 SLACK_TOKEN 设置
dev = "xoxb-your-dev-slack-token"
```

#### MacOS后端

```toml
[backends.macos]
enabled = true
default_sound = "Glass"
default_subtitle = "来自 Notice MCP"
show_in_notification_center = true

[backends.macos.sounds]
available = [
    "Basso", "Blow", "Bottle", "Frog", "Funk", "Glass", "Hero",
    "Morse", "Ping", "Pop", "Purr", "Sosumi", "Submarine", "Tink"
]
```

### 通知模板

```toml
[templates.default]
title = "通知"
message = "您有新的通知消息"

[templates.alert]
title = "⚠️ 警告"
message = "系统检测到异常情况"
sound = "Basso"

[templates.success]
title = "✅ 成功"
message = "操作已成功完成"
sound = "Hero"

[templates.error]
title = "❌ 错误"
message = "系统发生错误"
sound = "Sosumi"
```

### 环境变量映射

```toml
[environment]
EMAIL_USER = "backends.email.smtp.user"
EMAIL_PASS = "backends.email.smtp.pass"
SLACK_TOKEN = "backends.slack.workspaces.default"
WEBHOOK_URL = "backends.webhook.endpoints.default"
```

### 安全配置

```toml
[security]
allowed_ips = ["127.0.0.1", "::1"]
api_key = "your-api-key"  # 可选
require_https = false
```

### 速率限制

```toml
[rate_limiting]
enabled = false
max_requests_per_minute = 60
max_requests_per_hour = 1000
max_requests_per_day = 10000

[rate_limiting.backends]
email = 10
webhook = 100
slack = 50
macos = 200
```

## 使用方法

### 1. 创建配置文件

在项目根目录创建 `config.toml` 文件，并根据需要配置各个后端。

### 2. 启动服务器

```bash
node start.js
```

服务器启动时会自动加载配置文件，并显示配置摘要。

### 3. 发送通知

通知发送时会自动使用配置文件中的设置。如果在发送时提供了额外配置，会与配置文件中的设置合并（发送时的配置优先）。

### 4. 环境变量支持

敏感信息（如密码、令牌）可以通过环境变量设置：

```bash
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"
export SLACK_TOKEN="xoxb-your-slack-bot-token"
node start.js
```

## 配置验证

配置管理器会自动验证配置的有效性：

- 检查必需字段是否存在
- 验证后端配置的完整性
- 确保启用的后端有必要的配置

## 测试配置

可以使用测试脚本验证配置：

```bash
node test-config.js
```

或运行完整的集成测试：

```bash
npm test
```

## 配置热重载

配置管理器支持热重载功能（需要手动调用）：

```javascript
const { ConfigManager } = await import('./src/config/manager.js');
const configManager = new ConfigManager();
await configManager.reload();
```

## 最佳实践

1. **敏感信息**: 使用环境变量存储密码、令牌等敏感信息
2. **版本控制**: 将 `config.toml` 加入版本控制，但创建 `config.local.toml` 用于本地开发
3. **备份**: 定期备份配置文件
4. **验证**: 修改配置后运行测试确保配置有效
5. **文档**: 为团队成员提供配置说明文档

## 故障排除

### 配置文件不存在

如果 `config.toml` 不存在，服务器会使用默认配置并显示警告。

### 配置解析错误

检查 TOML 语法是否正确，特别注意：
- 字符串需要用引号包围
- 数组元素用逗号分隔
- 节名用方括号包围

### 后端配置无效

运行配置验证检查具体错误：

```bash
node test-config.js
```

### 环境变量未生效

确保环境变量名称与 `[environment]` 节中的映射一致。

## 示例配置文件

完整的示例配置文件请参考项目根目录下的 `config.toml` 文件。