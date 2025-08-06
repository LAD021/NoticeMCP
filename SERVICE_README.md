# Notice MCP Server 常驻服务

## 📋 概述

Notice MCP Server 现在已配置为 macOS 常驻服务，使用 `launchd` 进行管理。服务将在系统启动时自动运行，并在崩溃时自动重启。

### ✨ 特性

- **🔍 自动路径检测**: 安装脚本会自动检测 Node.js 安装路径和项目目录
- **📁 动态配置生成**: 不再依赖静态配置文件，避免在 git 中暴露本地路径信息
- **🚀 零配置安装**: 用户无需手动配置任何路径，一键安装即可使用

## 🚀 安装与卸载

### 安装常驻服务
```bash
./install-service.sh
```

### 卸载常驻服务
```bash
./uninstall-service.sh
```

## 🔧 服务管理

### 基本命令

**启动服务：**
```bash
launchctl load ~/Library/LaunchAgents/com.notice.mcp.plist
```

**停止服务：**
```bash
launchctl unload ~/Library/LaunchAgents/com.notice.mcp.plist
```

**查看服务状态：**
```bash
launchctl list | grep com.notice.mcp
```

**重启服务：**
```bash
launchctl unload ~/Library/LaunchAgents/com.notice.mcp.plist
launchctl load ~/Library/LaunchAgents/com.notice.mcp.plist
```

### 状态说明

- `PID` 列显示进程ID（如果正在运行）
- `Status` 列显示退出状态（0表示正常）
- `Label` 列显示服务名称

示例输出：
```
-       0       com.notice.mcp    # 服务正常运行
```

## 📝 日志管理

### 查看实时日志

**标准输出日志：**
```bash
tail -f logs/mcp-stdout.log
```

**错误日志：**
```bash
tail -f logs/mcp-stderr.log
```

### 日志文件位置

- 标准输出：`logs/mcp-stdout.log`
- 错误输出：`logs/mcp-stderr.log`

## ⚙️ 配置文件

### 服务配置

**位置：** `~/Library/LaunchAgents/com.notice.mcp.plist`

**配置生成：** 安装时动态生成，包含当前系统的实际路径

**主要配置项：**
- `RunAtLoad`: 系统启动时自动运行
- `KeepAlive`: 进程崩溃时自动重启
- `ThrottleInterval`: 重启间隔（10秒）
- `WorkingDirectory`: 自动检测的项目目录
- `StandardOutPath/StandardErrorPath`: 相对于项目目录的日志文件路径
- `ProgramArguments`: 自动检测的 Node.js 路径和启动脚本路径

### MCP 配置

**位置：** `config.toml`

服务使用项目目录中的 `config.toml` 文件进行配置。

## 🔍 故障排除

### 服务无法启动

1. **检查 Node.js 路径：**
   ```bash
   which node
   ```
   安装脚本会自动检测并使用正确的路径。

2. **检查文件权限：**
   ```bash
   ls -la ~/Library/LaunchAgents/com.notice.mcp.plist
   ```

3. **查看错误日志：**
   ```bash
   cat logs/mcp-stderr.log
   ```

### 服务频繁重启

1. **检查应用程序错误：**
   ```bash
   tail -f logs/mcp-stderr.log
   ```

2. **手动测试启动：**
   ```bash
   node start.js
   ```

### 权限问题

如果遇到权限问题，确保：
- 脚本文件有执行权限
- 日志目录可写
- plist 文件格式正确

## 📱 验证服务

### 测试通知功能

服务启动后，可以通过 MCP 客户端测试通知功能：

```javascript
// 通过 MCP 发送测试通知
{
  "backend": "macos",
  "title": "测试通知",
  "message": "常驻服务运行正常"
}
```

### 检查服务健康状态

```bash
# 检查进程是否运行
ps aux | grep "node.*start.js" | grep -v grep

# 检查端口占用（如果配置了HTTP端口）
lsof -i :3000
```

## 🎯 最佳实践

1. **定期检查日志：** 监控服务运行状态
2. **配置日志轮转：** 防止日志文件过大
3. **备份配置：** 定期备份 config.toml 文件（plist 文件会动态生成）
4. **测试重启：** 定期测试服务重启功能
5. **版本控制：** plist 文件已加入 .gitignore，避免提交本地路径信息

## 📞 支持

如果遇到问题，请：
1. 检查日志文件
2. 验证配置文件
3. 测试手动启动
4. 查看系统日志：`Console.app` 或 `log show --predicate 'subsystem == "com.apple.launchd"'`