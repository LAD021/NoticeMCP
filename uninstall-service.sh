#!/bin/bash

# Notice MCP Server 常驻服务卸载脚本

set -e

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
SERVICE_NAME="com.notice.mcp"
PLIST_PATH="$LAUNCH_AGENTS_DIR/$SERVICE_NAME.plist"

echo "🗑️  Notice MCP Server 常驻服务卸载程序"
echo "=" | tr '=' '=' | head -c 50 && echo

# 检查服务是否存在
if [ ! -f "$PLIST_PATH" ]; then
    echo "ℹ️  服务未安装或已被移除"
    exit 0
fi

# 停止并卸载服务
echo "🛑 停止并卸载服务..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true

# 删除 plist 文件
echo "🗑️  删除服务配置文件..."
rm -f "$PLIST_PATH"

# 检查是否成功卸载
if [ ! -f "$PLIST_PATH" ]; then
    echo "✅ 服务已成功卸载"
    echo "📋 已删除: $PLIST_PATH"
    echo ""
    echo "ℹ️  注意: 日志文件仍保留在 logs/ 目录中"
    echo "如需完全清理，请手动删除 logs/ 目录"
else
    echo "❌ 卸载失败，请手动删除配置文件"
    exit 1
fi

echo ""
echo "🎉 Notice MCP Server 常驻服务卸载完成！"