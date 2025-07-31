# Claude Desktop MCP 配置指南

本指南将帮助您在 Claude Desktop 中配置 Notice MCP Server。

## 📋 配置步骤

### 1. 找到 Claude Desktop 配置文件

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 2. 编辑配置文件

将以下内容添加到您的 `claude_desktop_config.json` 文件中：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": [
        "/Users/bbaa/WORK2025/mysmall/NoticeMCP/start.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**重要:** 请将 `/Users/bbaa/WORK2025/mysmall/NoticeMCP/start.js` 替换为您的实际项目路径。

### 3. 重启 Claude Desktop

保存配置文件后，重启 Claude Desktop 使配置生效。

## 🚀 使用方法

配置完成后，您可以在 Claude Desktop 中使用以下方式发送通知：

### 基本通知
```
请发送一个MacOS通知，标题是"任务完成"，内容是"代码编译成功"
```

### 带副标题的通知
```
发送通知：标题"构建完成"，内容"项目构建成功"，副标题"开发环境"
```

### 带声音的通知
```
发送一个带声音的通知，标题"警告"，内容"内存使用率过高"，声音"Basso"
```

## ⚙️ 高级配置

### 环境变量

您可以在 `env` 部分添加更多环境变量：

```json
"env": {
  "NODE_ENV": "production",
  "DEBUG": "false",
  "LOG_LEVEL": "info"
}
```

### 启动参数

您可以在 `args` 数组中添加启动参数：

```json
"args": [
  "/path/to/start.js",
  "--config",
  "/path/to/custom-config.toml"
]
```

### 相对路径支持

如果您的项目在固定位置，可以使用相对路径：

```json
"command": "node",
"args": ["./start.js"]
```

## 🔧 故障排除

### 1. 服务器无法启动

- 检查路径是否正确
- 确保 Node.js 已安装
- 检查项目依赖是否已安装 (`npm install`)

### 2. 通知不显示

- 检查 macOS 通知权限设置
- 确保 `config.toml` 文件存在且配置正确
- 查看 Claude Desktop 的开发者工具中的错误信息

### 3. 配置文件格式错误

- 确保 JSON 格式正确（无多余逗号、引号匹配等）
- 使用 JSON 验证工具检查语法

## 📝 示例配置文件

完整的 `claude_desktop_config.json` 示例：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": [
        "/Users/your-username/projects/NoticeMCP/start.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "false"
      }
    },
    "other-mcp-server": {
      "command": "python",
      "args": ["-m", "other_server"]
    }
  }
}
```

## 🎯 快速测试

配置完成后，在 Claude Desktop 中发送以下消息进行测试：

```
发送一个测试通知，标题"测试"，内容"Notice MCP Server 配置成功！"
```

如果看到 macOS 通知弹出，说明配置成功！

## 📚 更多信息

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [Claude Desktop 配置指南](https://claude.ai/docs)
- [项目 README](./README.md)
- [TOML 配置指南](./TOML_CONFIG_GUIDE.md)