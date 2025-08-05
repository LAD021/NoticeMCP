# Trae AI MCP 配置指南

本指南将帮助您在 Trae AI 中配置 Notice MCP Server。

## 📋 配置步骤

### 1. 找到 Trae AI 配置文件

**macOS:**
```
~/Library/Application Support/Trae/trae_config.json
```

**Windows:**
```
%APPDATA%\Trae\trae_config.json
```

### 2. 创建或编辑配置文件

如果配置文件不存在，请创建它。将以下内容添加到您的 `trae_config.json` 文件中：

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

### 3. 快速配置（推荐）

我们已经为您准备了一个配置文件模板 `trae_config.json`，您可以：

1. 复制项目根目录下的 `trae_config.json` 文件
2. 将其放置到 Trae 配置目录中
3. 根据需要修改路径

**macOS 快速配置命令:**
```bash
# 创建配置目录（如果不存在）
mkdir -p "~/Library/Application Support/Trae"

# 复制配置文件
cp trae_config.json "~/Library/Application Support/Trae/"
```

**Windows 快速配置命令:**
```cmd
# 创建配置目录（如果不存在）
mkdir "%APPDATA%\Trae"

# 复制配置文件
copy trae_config.json "%APPDATA%\Trae\"
```

### 4. 重启 Trae AI

保存配置文件后，重启 Trae AI 使配置生效。

## 🚀 使用方法

配置完成后，您可以在 Trae AI 中使用以下方式发送通知：

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

### 邮件通知
```
发送邮件通知给admin@company.com，主题"系统警告"，内容"服务器负载过高"
```

### Slack通知
```
发送Slack消息到#general频道："部署完成"
```

## ⚙️ 高级配置

### 环境变量

您可以在 `env` 部分添加更多环境变量：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": [
        "/path/to/NoticeMCP/start.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "false",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 多个MCP服务器

如果您有多个MCP服务器，可以这样配置：

```json
{
  "mcpServers": {
    "notice-mcp": {
      "command": "node",
      "args": ["/path/to/NoticeMCP/start.js"]
    },
    "other-mcp": {
      "command": "node",
      "args": ["/path/to/other-mcp/server.js"]
    }
  }
}
```

## 🔧 故障排除

### 1. MCP 连接错误 "ReferenceError: request is not defined"

**✅ 已修复**：此问题已在最新版本中解决。如果仍遇到此错误：

```bash
# 确保使用最新版本
cd /Users/bbaa/WORK2025/mysmall/NoticeMCP
git pull origin main  # 如果使用 Git

# 重启 MCP 服务器
node start.js
```

### 2. 服务器无法启动

检查路径是否正确：
```bash
# 测试路径是否存在
ls -la /Users/bbaa/WORK2025/mysmall/NoticeMCP/start.js

# 测试服务器是否可以运行
node /Users/bbaa/WORK2025/mysmall/NoticeMCP/start.js
```

### 3. 权限问题

确保文件有执行权限：
```bash
chmod +x /Users/bbaa/WORK2025/mysmall/NoticeMCP/start.js
```

### 4. Node.js版本

确保使用Node.js 18+：
```bash
node --version
```

### 5. 依赖问题

重新安装依赖：
```bash
cd /Users/bbaa/WORK2025/mysmall/NoticeMCP
npm install
```

## 📝 验证配置

配置完成后，您可以通过以下方式验证：

1. 重启 Trae AI
2. 在对话中输入："请列出所有可用的工具"
3. 查看是否包含 `send_notification` 工具
4. 尝试发送一个测试通知

## 🎯 使用场景

### AI 助手主动通知
- ✅ 任务完成通知
- ❌ 错误和异常提醒
- 📊 进度状态更新
- ⚠️ 重要警告信息

### 实际应用
- 代码编译完成
- 文件处理完毕
- 数据分析结果
- 部署操作状态
- 系统监控警告

## 📚 相关文档

- [AI 助手使用指南](./AI_ASSISTANT_GUIDE.md) - 详细的 AI 集成说明
- [TOML 配置指南](./TOML_CONFIG_GUIDE.md) - 配置文件详解
- [部署指南](./DEPLOYMENT.md) - 生产环境部署

## 💡 提示

- 确保 Notice MCP Server 正在运行
- 检查配置文件路径是否正确
- 重启 Trae AI 后配置才会生效
- 可以通过日志文件查看详细错误信息

---

**让 Trae AI 具备主动通知能力，提升您的工作效率！** 🚀