#!/bin/bash

# Notice MCP Server 常驻服务安装脚本
# 使用 macOS launchd 来管理服务

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
SERVICE_NAME="com.notice.mcp"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$SERVICE_NAME.plist"

echo "🚀 Notice MCP Server 常驻服务安装程序"
echo "=" | tr '=' '=' | head -c 50 && echo

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 自动检测 Node.js 路径
NODE_PATH="$(which node)"
if [ -z "$NODE_PATH" ]; then
    echo "❌ 错误: 无法找到 Node.js 可执行文件路径"
    exit 1
fi

echo "📍 Node.js 路径: $NODE_PATH"
echo "📁 项目目录: $SCRIPT_DIR"

# 创建 LaunchAgents 目录（如果不存在）
mkdir -p "$LAUNCH_AGENTS_DIR"

# 停止现有服务（如果正在运行）
echo "🛑 停止现有服务（如果存在）..."
launchctl unload "$LAUNCH_AGENTS_DIR/$SERVICE_NAME.plist" 2>/dev/null || true

# 动态生成 plist 文件
echo "📋 生成服务配置文件..."
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$SERVICE_NAME</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$SCRIPT_DIR/start.js</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/mcp-stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/mcp-stderr.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:$(dirname "$NODE_PATH")</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
    
    <key>ProcessType</key>
    <string>Background</string>
    
    <key>ThrottleInterval</key>
    <integer>10</integer>
</dict>
</plist>
EOF

# 加载并启动服务
echo "🔄 加载并启动服务..."
launchctl load "$PLIST_PATH"

# 检查服务状态
echo "📊 检查服务状态..."
sleep 2
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo "✅ 服务已成功启动并运行中"
    echo "📋 服务名称: $SERVICE_NAME"
    echo "📁 配置文件: $LAUNCH_AGENTS_DIR/$SERVICE_NAME.plist"
    echo "📝 日志文件: $SCRIPT_DIR/logs/"
    echo ""
    echo "🔧 管理命令:"
    echo "  启动服务: launchctl load ~/Library/LaunchAgents/$SERVICE_NAME.plist"
    echo "  停止服务: launchctl unload ~/Library/LaunchAgents/$SERVICE_NAME.plist"
    echo "  查看状态: launchctl list | grep $SERVICE_NAME"
    echo "  查看日志: tail -f $SCRIPT_DIR/logs/mcp-stdout.log"
else
    echo "❌ 服务启动失败，请检查日志文件"
    echo "📝 错误日志: $SCRIPT_DIR/logs/mcp-stderr.log"
    exit 1
fi

echo ""
echo "🎉 Notice MCP Server 常驻服务安装完成！"
echo "服务将在系统启动时自动运行，并在崩溃时自动重启。"