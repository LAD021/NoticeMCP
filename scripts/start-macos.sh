#!/bin/bash

# NoticeMCP - macOS 一键启动脚本
# 自动检测和安装依赖，然后启动服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 NoticeMCP - macOS 一键启动脚本${NC}"
echo "=" | tr '=' '=' | head -c 50 && echo
echo -e "${BLUE}📁 项目目录: $PROJECT_DIR${NC}"
echo

# 检查是否为macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ 错误: 此脚本仅支持 macOS 系统${NC}"
    exit 1
fi

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函数：安装 Homebrew
install_homebrew() {
    echo -e "${YELLOW}📦 正在安装 Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # 添加 Homebrew 到 PATH
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        export PATH="/opt/homebrew/bin:$PATH"
        echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
    elif [[ -f "/usr/local/bin/brew" ]]; then
        export PATH="/usr/local/bin:$PATH"
        echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
    fi
    
    echo -e "${GREEN}✅ Homebrew 安装完成${NC}"
}

# 函数：安装 Node.js
install_nodejs() {
    echo -e "${YELLOW}📦 正在安装 Node.js...${NC}"
    brew install node
    echo -e "${GREEN}✅ Node.js 安装完成${NC}"
}

# 函数：安装项目依赖
install_dependencies() {
    echo -e "${YELLOW}📦 正在安装项目依赖...${NC}"
    cd "$PROJECT_DIR"
    npm install
    echo -e "${GREEN}✅ 项目依赖安装完成${NC}"
}

# 函数：启动服务
start_service() {
    echo -e "${YELLOW}🚀 正在启动 NoticeMCP 服务...${NC}"
    cd "$PROJECT_DIR"
    
    # 检查是否已有服务在运行
    if pgrep -f "tsx start.ts" > /dev/null; then
        echo -e "${YELLOW}⚠️  检测到服务已在运行，正在重启...${NC}"
        pkill -f "tsx start.ts" || true
        sleep 2
    fi
    
    # 启动服务
    echo -e "${GREEN}✅ 启动 NoticeMCP 服务...${NC}"
    npm start &
    
    # 等待服务启动
    sleep 3
    
    # 检查服务是否成功启动
    if pgrep -f "tsx start.ts" > /dev/null; then
        echo -e "${GREEN}🎉 NoticeMCP 服务启动成功！${NC}"
        echo -e "${BLUE}📋 服务状态: 运行中${NC}"
        echo -e "${BLUE}🔧 配置文件: $PROJECT_DIR/config.toml${NC}"
        echo -e "${BLUE}📝 日志查看: tail -f $PROJECT_DIR/logs/notice-mcp.log${NC}"
        echo
        echo -e "${YELLOW}💡 提示:${NC}"
        echo -e "  - 使用 ${GREEN}./scripts/stop-macos.sh${NC} 停止服务"
        echo -e "  - 使用 ${GREEN}./scripts/status-macos.sh${NC} 查看服务状态"
        echo -e "  - 配置文件位于 ${GREEN}config.toml${NC}"
    else
        echo -e "${RED}❌ 服务启动失败，请检查日志${NC}"
        exit 1
    fi
}

# 主流程
echo -e "${BLUE}🔍 检查系统环境...${NC}"

# 检查 Homebrew
if ! command_exists brew; then
    echo -e "${YELLOW}⚠️  未检测到 Homebrew，正在安装...${NC}"
    install_homebrew
else
    echo -e "${GREEN}✅ Homebrew 已安装: $(brew --version | head -n1)${NC}"
fi

# 检查 Node.js
if ! command_exists node; then
    echo -e "${YELLOW}⚠️  未检测到 Node.js，正在安装...${NC}"
    install_nodejs
else
    echo -e "${GREEN}✅ Node.js 已安装: $(node --version)${NC}"
fi

# 检查 npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm 未找到，请重新安装 Node.js${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm 已安装: $(npm --version)${NC}"
fi

# 检查项目依赖
echo -e "${BLUE}🔍 检查项目依赖...${NC}"
cd "$PROJECT_DIR"

if [[ ! -d "node_modules" ]] || [[ ! -f "node_modules/.package-lock.json" ]]; then
    echo -e "${YELLOW}⚠️  项目依赖未安装，正在安装...${NC}"
    install_dependencies
else
    echo -e "${GREEN}✅ 项目依赖已安装${NC}"
fi

# 检查配置文件
if [[ ! -f "$PROJECT_DIR/config.toml" ]]; then
    echo -e "${YELLOW}⚠️  配置文件不存在，正在创建默认配置...${NC}"
    if [[ -f "$PROJECT_DIR/config.example.toml" ]]; then
        cp "$PROJECT_DIR/config.example.toml" "$PROJECT_DIR/config.toml"
        echo -e "${GREEN}✅ 已创建默认配置文件${NC}"
        echo -e "${YELLOW}💡 请根据需要编辑 config.toml 文件${NC}"
    else
        echo -e "${RED}❌ 未找到配置模板文件${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 配置文件已存在${NC}"
fi

echo
echo -e "${BLUE}🚀 所有依赖检查完成，正在启动服务...${NC}"
echo

# 启动服务
start_service

echo
echo -e "${GREEN}🎉 NoticeMCP 启动完成！${NC}"
echo -e "${BLUE}📖 更多信息请查看: README.md${NC}"