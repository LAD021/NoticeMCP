#!/bin/bash

# Notice MCP Server 测试运行脚本
# 用于快速执行集成测试

echo "🚀 Notice MCP Server 测试套件"
echo "=============================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查是否在MacOS上
if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "⚠️  警告: 当前不是MacOS系统，MacOS通知测试可能失败"
fi

# 检查项目文件
if [[ ! -f "package.json" ]]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 开始执行测试..."
echo ""

# 运行集成测试
node tests/integration.test.js

test_exit_code=$?

echo ""
echo "=============================="

if [[ $test_exit_code -eq 0 ]]; then
    echo "✅ 测试完成！"
    echo "💡 如果您看到了系统通知弹出，说明MacOS后端工作正常"
    echo "🎯 现在可以在Claude Desktop中使用Notice MCP Server了"
else
    echo "❌ 测试失败，请检查上述错误信息"
    echo "💡 提示:"
    echo "   - 确保在系统偏好设置 > 通知中允许终端发送通知"
    echo "   - 检查所有依赖文件是否存在"
    exit 1
fi

echo ""
echo "📚 更多信息请查看:"
echo "   - README.md - 使用说明"
echo "   - DEPLOYMENT.md - 部署指南"
echo "   - tests/integration.test.js - 测试详情"