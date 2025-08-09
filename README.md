# Notice MCP Server

一个专为 AI 助手设计的 Model Context Protocol (MCP) 通知服务器，让 AI 能够主动向用户发送任务完成、错误提醒和状态更新等重要通知。

## 📦 当前版本：v0.3.0

**v0.3.0 特性：**
- ✅ 完整的 macOS 系统通知支持
- ✅ 完整的飞书通知支持
- ✅ 稳定的 MCP 协议连接
- ✅ TOML 配置文件管理
- ✅ 完善的错误处理和状态反馈
- ✅ 多后端同时发送通知能力
- ✅ TypeScript 重构，更好的类型安全

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置文件

复制配置示例文件：

```bash
cp config.example.toml config.toml
```

编辑 `config.toml` 文件，配置您需要的通知后端。

### 启动服务器

```bash
# 使用 Node.js 启动（推荐）
node start.js

# 或使用 TypeScript 启动
npm run start
```

## 🔧 支持的通知后端

### 1. macOS 系统通知 ✅
- 发送原生 macOS 桌面通知
- 支持标题、副标题和系统声音
- 无需额外配置，直接使用系统通知中心
- **注意**：通知持久性受 macOS 系统设置限制

**配置示例：**
```toml
[backends.macos]
enabled = true
default_sound = "Glass"
default_subtitle = "来自 Notice MCP"
```

### 2. 飞书通知 ✅
- 通过飞书机器人 Webhook 发送消息到飞书群聊
- 支持文本消息、富文本消息和卡片消息
- 支持 @所有人、@指定用户（open_id）、@手机号
- 支持签名校验确保消息安全性
- 可配置多个群聊机器人

**配置示例：**
```toml
[backends.feishu]
enabled = true
webhook_url = "https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_WEBHOOK_TOKEN"
secret = "your-bot-secret"  # 可选，用于安全验证
```

### 3. 其他后端 🚧
- **邮件通知**：开发中
- **Webhook 通知**：开发中
- **Windows 系统通知**：计划中

## 📋 MCP 工具

本服务器提供以下 MCP 工具：

### `send_notification`
发送通知消息到指定后端

**参数：**
- `title` (string): 通知标题
- `message` (string): 通知内容
- `backend` (string): 通知后端类型 (`macos`, `feishu`)
- `config` (object, 可选): 后端特定配置

**示例：**
```json
{
  "title": "任务完成",
  "message": "您的 AI 任务已成功完成！",
  "backend": "macos",
  "config": {
    "subtitle": "AI 助手",
    "sound": "Glass"
  }
}
```

### `get_backends`
获取所有可用的通知后端

**返回：**
```json
{
  "backends": ["macos", "feishu"],
  "count": 2,
  "descriptions": {
    "macos": "Mac系统通知后端 - 使用macOS原生通知系统发送桌面通知",
    "feishu": "飞书通知后端 - 通过飞书机器人Webhook发送消息到飞书群聊"
  }
}
```

## 🔗 AI 助手集成

### Trae AI 集成

参见：[Trae AI 设置指南](./docs/TRAE_SETUP.md)

### Claude Desktop 集成

参见：[Claude Desktop 设置指南](./docs/CLAUDE_DESKTOP_SETUP.md)

## 📁 项目结构

```
NoticeMCP/
├── src/                    # TypeScript 源码
│   ├── backends/          # 通知后端实现
│   ├── config/            # 配置管理
│   ├── mcp/              # MCP 协议实现
│   ├── notification/      # 通知管理器
│   └── utils/            # 工具函数
├── docs/                  # 文档
├── scripts/               # 脚本文件
├── tests/                 # 测试文件
├── start.js              # 主启动文件（Node.js）
├── start.ts              # 主启动文件（TypeScript）
├── config.example.toml    # 配置文件示例
└── package.json          # 项目配置
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 测试 macOS 通知
npm run test:macos

# 测试配置文件
npm run test:config
```

## 🔧 开发

```bash
# 构建 TypeScript
npm run build

# 开发模式启动
npm run dev
```

## 📝 配置说明

详细的配置说明请参见：[TOML 配置指南](./docs/TOML_CONFIG_GUIDE.md)

## 🐛 故障排除

### macOS 通知不显示
1. 检查系统偏好设置 > 通知与专注模式
2. 确保终端或您的应用有通知权限
3. 检查勿扰模式是否开启

### 飞书通知失败
1. 检查 webhook URL 是否正确
2. 验证机器人是否已添加到群聊
3. 检查签名配置（如果启用）

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请在 GitHub 上创建 Issue。