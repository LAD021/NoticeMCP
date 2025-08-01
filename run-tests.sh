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

# 检查测试类型参数
TEST_TYPE=${1:-"all"}

case $TEST_TYPE in
    "unit")
        echo "🔧 运行单元测试..."
        node tests/unit/server.test.js
        test_exit_code=$?
        ;;
    "integration")
        echo "🔗 运行集成测试..."
        node tests/integration.test.js
        integration_exit_code=$?
        node tests/integration/trae-integration.test.js
        trae_exit_code=$?
        test_exit_code=$((integration_exit_code + trae_exit_code))
        ;;
    "backends")
        echo "🔌 运行后端测试..."
        node tests/backends/macos.test.js
        macos_exit_code=$?
        node tests/backends/node-notifier.test.js
        notifier_exit_code=$?
        test_exit_code=$((macos_exit_code + notifier_exit_code))
        ;;
    "config")
        echo "⚙️ 运行配置测试..."
        node tests/config/config.test.js
        test_exit_code=$?
        ;;
    "mcp")
        echo "📡 运行MCP测试..."
        node tests/mcp/mcp-macos.test.js
        test_exit_code=$?
        ;;
    "all")
        echo "🚀 运行所有测试..."
        echo ""
        
        echo "1️⃣ 单元测试:"
        node tests/unit/server.test.js
        unit_exit_code=$?
        echo ""
        
        echo "2️⃣ 配置测试:"
        node tests/config/config.test.js
        config_exit_code=$?
        echo ""
        
        echo "3️⃣ 后端测试:"
        node tests/backends/macos.test.js
        macos_exit_code=$?
        echo ""
        node tests/backends/node-notifier.test.js
        notifier_exit_code=$?
        echo ""
        
        echo "4️⃣ MCP测试:"
        node tests/mcp/mcp-macos.test.js
        mcp_exit_code=$?
        echo ""
        
        echo "5️⃣ 集成测试:"
        node tests/integration.test.js
        integration_exit_code=$?
        echo ""
        node tests/integration/trae-integration.test.js
        trae_exit_code=$?
        
        test_exit_code=$((unit_exit_code + config_exit_code + macos_exit_code + notifier_exit_code + mcp_exit_code + integration_exit_code + trae_exit_code))
        ;;
    *)
        echo "❌ 未知的测试类型: $TEST_TYPE"
        echo "💡 可用的测试类型: unit, integration, backends, config, mcp, all"
        echo "📝 使用方法: ./run-tests.sh [测试类型]"
        exit 1
        ;;
esac

echo ""
echo "=============================="

if [[ $test_exit_code -eq 0 ]]; then
    echo "✅ 测试完成！"
    echo "💡 如果您看到了系统通知弹出，说明MacOS后端工作正常"
    echo "🎯 现在可以在Claude Desktop或Trae AI中使用Notice MCP Server了"
else
    echo "❌ 测试失败，请检查上述错误信息"
    echo "💡 提示:"
    echo "   - 确保在系统偏好设置 > 通知中允许终端发送通知"
    echo "   - 检查所有依赖文件是否存在"
    echo "   - 尝试运行特定类型的测试进行调试"
    exit 1
fi

echo ""
echo "📚 使用方法:"
echo "   ./run-tests.sh [测试类型]"
echo ""
echo "🔧 可用的测试类型:"
echo "   unit        - 单元测试"
echo "   integration - 集成测试"
echo "   backends    - 后端测试"
echo "   config      - 配置测试"
echo "   mcp         - MCP协议测试"
echo "   all         - 所有测试 (默认)"
echo ""
echo "📚 更多信息请查看:"
echo "   tests/README.md - 测试目录结构说明"
echo "   - README.md - 使用说明"
echo "   - DEPLOYMENT.md - 部署指南"
echo "   - tests/integration.test.js - 测试详情"