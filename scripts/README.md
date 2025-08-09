# NoticeMCP - macOS 脚本使用指南

本目录包含了 NoticeMCP 在 macOS 系统上的管理脚本，支持一键启动、停止和状态检查。

## 🚀 快速开始

### 一键启动服务
```bash
./scripts/start-macos.sh
```

这个脚本会自动：
- 检测并安装 Homebrew（如果未安装）
- 检测并安装 Node.js（如果未安装）
- 安装项目依赖
- 创建默认配置文件（如果不存在）
- 启动 NoticeMCP 服务

### 停止服务
```bash
./scripts/stop-macos.sh
```

### 查看服务状态
```bash
./scripts/status-macos.sh
```

## 📋 脚本详细说明

### start-macos.sh - 启动脚本

**功能特性：**
- ✅ 零依赖启动：自动检测和安装所需依赖
- ✅ 智能检测：检查 Homebrew、Node.js、npm 等环境
- ✅ 自动配置：创建默认配置文件
- ✅ 服务管理：检测已运行服务并智能重启
- ✅ 状态反馈：详细的启动过程和结果反馈

**使用场景：**
- 首次部署 NoticeMCP
- 系统重启后恢复服务
- 更新代码后重启服务

### stop-macos.sh - 停止脚本

**功能特性：**
- ✅ 优雅停止：先尝试正常终止进程
- ✅ 强制停止：必要时强制终止残留进程
- ✅ 清理功能：清理临时文件和锁文件
- ✅ 状态验证：确认服务完全停止

**使用场景：**
- 维护前停止服务
- 配置更新前停止服务
- 系统关机前清理

### status-macos.sh - 状态检查脚本

**功能特性：**
- ✅ 服务状态：检查进程运行状态和详细信息
- ✅ 系统环境：检查 Node.js、npm、Homebrew 等
- ✅ 项目状态：检查配置文件、依赖等
- ✅ 网络状态：检查端口占用情况
- ✅ 日志状态：检查日志文件大小和行数
- ✅ 快速操作：提供常用命令提示

**使用场景：**
- 故障排查
- 系统监控
- 部署验证

## 🛠️ 系统要求

- **操作系统：** macOS 10.15+ (Catalina 或更高版本)
- **权限：** 用户权限（无需 sudo）
- **网络：** 需要互联网连接（用于下载依赖）

## 📁 文件结构

```
scripts/
├── start-macos.sh      # 启动脚本
├── stop-macos.sh       # 停止脚本
├── status-macos.sh     # 状态检查脚本
├── README.md           # 本说明文件
├── install-service.sh  # 系统服务安装脚本
└── uninstall-service.sh # 系统服务卸载脚本
```

## 🔧 配置说明

### 配置文件位置
- **主配置：** `config.toml`
- **示例配置：** `config.example.toml`

### 首次运行
1. 运行 `./scripts/start-macos.sh`
2. 脚本会自动创建 `config.toml`（基于 `config.example.toml`）
3. 根据需要编辑 `config.toml` 文件
4. 重启服务使配置生效

## 📝 日志管理

### 日志文件位置
- **主日志：** `logs/notice-mcp.log`
- **错误日志：** `logs/error.log`
- **访问日志：** `logs/access.log`

### 查看日志
```bash
# 实时查看日志
tail -f logs/notice-mcp.log

# 查看最近的错误
tail -n 50 logs/error.log

# 查看日志统计
wc -l logs/*.log
```

## 🚨 故障排查

### 常见问题

1. **服务启动失败**
   ```bash
   # 检查详细状态
   ./scripts/status-macos.sh
   
   # 查看错误日志
   tail -f logs/error.log
   ```

2. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :3000
   
   # 终止占用进程
   kill -9 <PID>
   ```

3. **依赖安装失败**
   ```bash
   # 手动安装 Homebrew
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # 手动安装 Node.js
   brew install node
   
   # 重新安装项目依赖
   npm install
   ```

4. **配置文件问题**
   ```bash
   # 重新创建配置文件
   cp config.example.toml config.toml
   
   # 验证配置文件格式
   node -e "console.log('配置文件格式正确')"
   ```

### 完全重置

如果遇到无法解决的问题，可以执行完全重置：

```bash
# 1. 停止服务
./scripts/stop-macos.sh

# 2. 清理依赖
rm -rf node_modules package-lock.json

# 3. 重新启动
./scripts/start-macos.sh
```

## 🔄 自动化部署

### 系统服务模式

如果需要开机自启动，可以使用系统服务脚本：

```bash
# 安装为系统服务
./scripts/install-service.sh

# 卸载系统服务
./scripts/uninstall-service.sh
```

### 定时任务

可以通过 crontab 设置定时检查：

```bash
# 编辑 crontab
crontab -e

# 添加每5分钟检查一次的任务
*/5 * * * * /path/to/NoticeMCP/scripts/status-macos.sh > /dev/null 2>&1
```

## 📞 技术支持

如果遇到问题，请：

1. 运行 `./scripts/status-macos.sh` 收集系统信息
2. 查看 `logs/error.log` 获取错误详情
3. 检查 `config.toml` 配置是否正确
4. 参考本文档的故障排查部分

## 🎯 最佳实践

1. **定期备份配置文件**
   ```bash
   cp config.toml config.toml.backup.$(date +%Y%m%d)
   ```

2. **监控日志大小**
   ```bash
   # 定期清理大日志文件
   find logs/ -name "*.log" -size +100M -exec truncate -s 0 {} \;
   ```

3. **更新依赖**
   ```bash
   # 定期更新 npm 依赖
   npm update
   
   # 更新 Homebrew
   brew update && brew upgrade
   ```

4. **安全考虑**
   - 不要在配置文件中存储明文密码
   - 定期检查和更新依赖版本
   - 监控服务运行状态

---

**版本：** 1.0.0  
**更新时间：** 2025年1月  
**兼容性：** macOS 10.15+, Node.js 16+