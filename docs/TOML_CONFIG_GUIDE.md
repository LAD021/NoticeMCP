# TOML 配置指南

本指南详细说明了 Notice MCP Server 的 TOML 配置文件格式和选项。

## 📋 配置文件概述

Notice MCP Server 使用 TOML 格式的配置文件来管理所有设置。配置文件通常命名为 `config.toml`，位于项目根目录。

## 🚀 快速开始

### 1. 创建配置文件

```bash
# 复制示例配置文件
cp config.example.toml config.toml
```

### 2. 基本配置结构

```toml
[server]
name = "Notice MCP Server"
version = "0.3.0"
debug = false

[logging]
level = "info"
enable_console = true
file = "notice.log"

[backends.macos]
enabled = true
default_sound = "Glass"
default_subtitle = "来自 Notice MCP"

[backends.feishu]
enabled = true
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_TOKEN"
secret = "your-secret"
```

## 📝 配置节详解

### [server] - 服务器配置

```toml
[server]
name = "Notice MCP Server"          # 服务器名称
version = "0.3.0"                   # 版本号
debug = false                       # 调试模式
port = 3000                         # 端口号（可选）
```

**参数说明：**
- `name`: 服务器显示名称
- `version`: 当前版本号
- `debug`: 是否启用调试模式（true/false）
- `port`: 服务器端口（可选，默认不使用）

### [logging] - 日志配置

```toml
[logging]
level = "info"                      # 日志级别
enable_console = true               # 控制台输出
file = "notice.log"                 # 日志文件
max_size = "10MB"                   # 最大文件大小（可选）
max_files = 5                       # 最大文件数量（可选）
```

**日志级别：**
- `error`: 仅错误信息
- `warn`: 警告和错误
- `info`: 信息、警告和错误（推荐）
- `debug`: 所有信息（调试用）

### [backends.macos] - macOS 通知配置

```toml
[backends.macos]
enabled = true                      # 是否启用
default_sound = "Glass"             # 默认声音
default_subtitle = "来自 Notice MCP" # 默认副标题
show_in_notification_center = true  # 显示在通知中心
timeout = 5                         # 超时时间（秒）
```

**可用声音：**
- `Basso`, `Blow`, `Bottle`, `Frog`, `Funk`
- `Glass`, `Hero`, `Morse`, `Ping`, `Pop`
- `Purr`, `Sosumi`, `Submarine`, `Tink`

### [backends.feishu] - 飞书通知配置

```toml
[backends.feishu]
enabled = true                                              # 是否启用
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_TOKEN"  # Webhook URL
secret = "your-secret"                                      # 签名密钥（可选）
default_at_all = false                                      # 默认@所有人
default_message_type = "text"                               # 默认消息类型
timeout = 10                                                # 请求超时（秒）
```

**消息类型：**
- `text`: 纯文本消息
- `rich_text`: 富文本消息
- `interactive`: 交互式卡片

### [backends.email] - 邮件通知配置（开发中）

```toml
[backends.email]
enabled = false                     # 是否启用
default_from = "noreply@example.com" # 默认发件人
default_subject = "通知"             # 默认主题

[backends.email.smtp]
host = "smtp.gmail.com"             # SMTP 服务器
port = 587                          # SMTP 端口
secure = false                      # 是否使用 SSL
user = "${EMAIL_USER}"              # 用户名（环境变量）
pass = "${EMAIL_PASS}"              # 密码（环境变量）
```

### [backends.webhook] - Webhook 通知配置（开发中）

```toml
[backends.webhook]
enabled = false                     # 是否启用
default_url = "https://example.com/webhook"  # 默认 URL
default_method = "POST"             # 默认 HTTP 方法
timeout = 10                        # 请求超时（秒）

[backends.webhook.headers]
"Content-Type" = "application/json"
"Authorization" = "Bearer ${WEBHOOK_TOKEN}"
```

### [rate_limiting] - 速率限制配置（可选）

```toml
[rate_limiting]
enabled = true                      # 是否启用速率限制
max_requests = 100                  # 最大请求数
time_window = 3600                  # 时间窗口（秒）
per_backend = true                  # 按后端分别限制
```

## 🔐 环境变量支持

配置文件支持环境变量替换，使用 `${VARIABLE_NAME}` 语法：

```toml
[backends.feishu]
webhook_url = "${FEISHU_WEBHOOK_URL}"
secret = "${FEISHU_SECRET}"

[backends.email.smtp]
user = "${EMAIL_USER}"
pass = "${EMAIL_PASS}"
```

**设置环境变量：**

```bash
# macOS/Linux
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_TOKEN"
export FEISHU_SECRET="your-secret"
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"

# Windows
set FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_TOKEN
set FEISHU_SECRET=your-secret
```

## 📋 完整配置示例

```toml
# Notice MCP Server 配置文件

[server]
name = "Notice MCP Server"
version = "0.3.0"
debug = false

[logging]
level = "info"
enable_console = true
file = "logs/notice.log"
max_size = "10MB"
max_files = 5

# macOS 系统通知
[backends.macos]
enabled = true
default_sound = "Glass"
default_subtitle = "来自 AI 助手"
show_in_notification_center = true
timeout = 5

# 飞书通知
[backends.feishu]
enabled = true
webhook_url = "${FEISHU_WEBHOOK_URL}"
secret = "${FEISHU_SECRET}"
default_at_all = false
default_message_type = "text"
timeout = 10

# 邮件通知（开发中）
[backends.email]
enabled = false
default_from = "noreply@yourcompany.com"
default_subject = "AI 助手通知"

[backends.email.smtp]
host = "smtp.gmail.com"
port = 587
secure = false
user = "${EMAIL_USER}"
pass = "${EMAIL_PASS}"

# Webhook 通知（开发中）
[backends.webhook]
enabled = false
default_url = "${WEBHOOK_URL}"
default_method = "POST"
timeout = 10

[backends.webhook.headers]
"Content-Type" = "application/json"
"Authorization" = "Bearer ${WEBHOOK_TOKEN}"
"X-Source" = "Notice-MCP"

# 速率限制
[rate_limiting]
enabled = true
max_requests = 100
time_window = 3600
per_backend = true

# 模板配置（可选）
[templates.success]
title = "✅ 成功"
message = "操作已成功完成"
sound = "Hero"

[templates.error]
title = "❌ 错误"
message = "操作失败，请检查日志"
sound = "Basso"

[templates.warning]
title = "⚠️ 警告"
message = "请注意以下问题"
sound = "Funk"
```

## 🔧 配置验证

### 1. 语法检查

使用 TOML 验证工具检查语法：

```bash
# 使用 Python toml 库
python -c "import toml; toml.load('config.toml'); print('配置文件语法正确')"

# 使用在线工具
# https://www.toml-lint.com/
```

### 2. 配置测试

启动服务器时会自动验证配置：

```bash
node start.js
```

看到以下输出表示配置正确：
```
✅ 配置文件加载成功
✅ Notice MCP Server 已启动，等待连接...
📋 可用工具: send_notification, get_backends
```

## 🚨 常见问题

### 1. 配置文件不存在

**错误：** `配置文件 config.toml 不存在`

**解决：**
```bash
cp config.example.toml config.toml
```

### 2. TOML 语法错误

**错误：** `TOML 解析错误`

**解决：**
- 检查引号是否匹配
- 确保键值对格式正确
- 验证节名称格式

### 3. 环境变量未设置

**错误：** `环境变量 FEISHU_WEBHOOK_URL 未设置`

**解决：**
```bash
export FEISHU_WEBHOOK_URL="your-webhook-url"
```

### 4. 后端配置错误

**错误：** `飞书后端配置无效`

**解决：**
- 检查 webhook_url 格式
- 验证 secret 是否正确
- 确保网络连接正常

## 🎯 最佳实践

1. **使用环境变量**：敏感信息（如密钥、密码）使用环境变量
2. **备份配置**：定期备份配置文件
3. **版本控制**：将 `config.example.toml` 加入版本控制，排除 `config.toml`
4. **分环境配置**：开发、测试、生产使用不同配置
5. **定期检查**：定期验证配置文件的有效性

## 📚 相关文档

- [TOML 官方规范](https://toml.io/)
- [项目 README](../README.md)
- [Trae AI 设置指南](./TRAE_SETUP.md)
- [Claude Desktop 设置指南](./CLAUDE_DESKTOP_SETUP.md)