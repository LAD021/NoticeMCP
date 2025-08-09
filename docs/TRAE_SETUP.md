# Trae AI 设置指南

本指南将帮助您在 Trae AI 中配置 Notice MCP Server，让 AI 助手能够发送通知。

## 📋 前提条件

- 已安装 Trae AI
- 已完成 Notice MCP Server 的安装和配置
- Notice MCP Server 能够正常启动

## 🔧 配置步骤

### 1. 找到 Trae AI 配置文件

**macOS:**
```bash
~/Library/Application Support/Trae/trae_config.json
```

**Windows:**
```bash
%APPDATA%\Trae\trae_config.json
```

### 2. 编辑配置文件

在配置文件中添加 Notice MCP Server：

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

**重要：** 请将 `/path/to/your/NoticeMCP/start.js` 替换为您的实际项目路径。

### 3. 重启 Trae AI

保存配置文件后，完全退出并重新启动 Trae AI。

### 4. 验证连接

在 Trae AI 中询问：

```
你现在有哪些工具可以使用？
```

如果配置成功，AI 应该会提到 `send_notification` 和 `get_backends` 工具。

## 🚀 使用示例

配置完成后，您可以在 Trae AI 中使用以下方式发送通知：

### macOS 通知
```
发送一个 macOS 通知，标题是"任务完成"，内容是"代码编译成功"
```

### 飞书通知
```
发送飞书通知到开发群，标题"部署完成"，内容"新版本已成功部署到生产环境"
```

### 查看可用后端
```
显示所有可用的通知后端
```

## 🔧 故障排除

### 1. MCP 服务器无法连接

**症状：** Trae AI 提示找不到 MCP 工具

**解决方案：**
- 检查配置文件路径是否正确
- 确认 Notice MCP Server 能够独立启动
- 验证 `start.js` 文件路径是否正确
- 重启 Trae AI

### 2. 权限错误

**症状：** 提示权限被拒绝

**解决方案：**
```bash
# 确保文件有执行权限
chmod +x /path/to/your/NoticeMCP/start.js

# 检查 Node.js 是否在 PATH 中
which node
```

### 3. 配置文件语法错误

**症状：** Trae AI 启动失败或无法加载配置

**解决方案：**
- 使用 JSON 验证器检查配置文件语法
- 确保所有引号和括号正确匹配
- 检查路径中的反斜杠转义（Windows）

### 4. 测试连接

运行以下命令测试 MCP 服务器：

```bash
# 进入项目目录
cd /path/to/your/NoticeMCP

# 启动服务器
node start.js
```

应该看到：
```
✅ Notice MCP Server 已启动，等待连接...
📋 可用工具: send_notification, get_backends
```

## 📝 高级配置

### 环境变量

您可以在配置中添加环境变量：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/path/to/your/NoticeMCP/start.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "info",
        "CONFIG_PATH": "/path/to/custom/config.toml"
      }
    }
  }
}
```

### 多个 MCP 服务器

您可以同时配置多个 MCP 服务器：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/path/to/NoticeMCP/start.js"]
    },
    "other-mcp": {
      "command": "python",
      "args": ["/path/to/other-mcp/server.py"]
    }
  }
}
```

## 🎯 最佳实践

1. **使用绝对路径**：避免相对路径可能导致的问题
2. **定期测试**：确保 MCP 服务器能够正常启动
3. **查看日志**：检查 Trae AI 的日志文件以诊断问题
4. **备份配置**：在修改前备份配置文件

## 📞 获取帮助

如果遇到问题：

1. 检查 Notice MCP Server 的日志输出
2. 查看 Trae AI 的错误信息
3. 在项目 GitHub 页面创建 Issue
4. 提供详细的错误信息和配置文件（隐藏敏感信息）