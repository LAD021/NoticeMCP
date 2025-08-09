#!/bin/bash

# NoticeMCP - macOS 服务状态检查脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}📊 NoticeMCP - macOS 服务状态检查${NC}"
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

# 函数：检查服务进程状态
check_service_status() {
    echo -e "${CYAN}🔍 服务进程状态:${NC}"
    
    RUNNING_PIDS=$(pgrep -f "tsx start.ts" 2>/dev/null || true)
    
    if [[ -z "$RUNNING_PIDS" ]]; then
        echo -e "  ${RED}❌ NoticeMCP 服务: 未运行${NC}"
        return 1
    else
        echo -e "  ${GREEN}✅ NoticeMCP 服务: 运行中${NC}"
        echo "$RUNNING_PIDS" | while read -r pid; do
            if [[ -n "$pid" ]]; then
                # 获取进程详细信息
                PROCESS_INFO=$(ps -p "$pid" -o pid,ppid,etime,pcpu,pmem,command 2>/dev/null || true)
                if [[ -n "$PROCESS_INFO" ]]; then
                    echo -e "    ${YELLOW}PID: $pid${NC}"
                    echo "$PROCESS_INFO" | tail -n +2 | while read -r line; do
                        echo -e "      ${BLUE}$line${NC}"
                    done
                fi
            fi
        done
        return 0
    fi
}

# 函数：检查系统环境
check_system_environment() {
    echo -e "${CYAN}🖥️  系统环境:${NC}"
    
    # 操作系统信息
    echo -e "  ${BLUE}操作系统: $(uname -s) $(uname -r)${NC}"
    echo -e "  ${BLUE}架构: $(uname -m)${NC}"
    
    # Node.js 状态
    if command_exists node; then
        echo -e "  ${GREEN}✅ Node.js: $(node --version)${NC}"
    else
        echo -e "  ${RED}❌ Node.js: 未安装${NC}"
    fi
    
    # npm 状态
    if command_exists npm; then
        echo -e "  ${GREEN}✅ npm: $(npm --version)${NC}"
    else
        echo -e "  ${RED}❌ npm: 未安装${NC}"
    fi
    
    # tsx 状态
    if command_exists tsx; then
        echo -e "  ${GREEN}✅ tsx: $(tsx --version 2>/dev/null || echo '已安装')${NC}"
    else
        echo -e "  ${YELLOW}⚠️  tsx: 未全局安装 (项目本地可能已安装)${NC}"
    fi
    
    # Homebrew 状态
    if command_exists brew; then
        echo -e "  ${GREEN}✅ Homebrew: $(brew --version | head -n1)${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Homebrew: 未安装${NC}"
    fi
}

# 函数：检查项目状态
check_project_status() {
    echo -e "${CYAN}📦 项目状态:${NC}"
    
    cd "$PROJECT_DIR"
    
    # package.json 检查
    if [[ -f "package.json" ]]; then
        echo -e "  ${GREEN}✅ package.json: 存在${NC}"
        
        # 获取项目名称和版本
        if command_exists node; then
            PROJECT_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "未知")
            PROJECT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "未知")
            echo -e "    ${BLUE}项目名称: $PROJECT_NAME${NC}"
            echo -e "    ${BLUE}项目版本: $PROJECT_VERSION${NC}"
        fi
    else
        echo -e "  ${RED}❌ package.json: 不存在${NC}"
    fi
    
    # node_modules 检查
    if [[ -d "node_modules" ]]; then
        echo -e "  ${GREEN}✅ node_modules: 存在${NC}"
        NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "未知")
        echo -e "    ${BLUE}大小: $NODE_MODULES_SIZE${NC}"
    else
        echo -e "  ${RED}❌ node_modules: 不存在${NC}"
    fi
    
    # 配置文件检查
    if [[ -f "config.toml" ]]; then
        echo -e "  ${GREEN}✅ config.toml: 存在${NC}"
    else
        echo -e "  ${YELLOW}⚠️  config.toml: 不存在${NC}"
        if [[ -f "config.example.toml" ]]; then
            echo -e "    ${BLUE}config.example.toml: 存在${NC}"
        fi
    fi
    
    # TypeScript 文件检查
    if [[ -f "start.ts" ]]; then
        echo -e "  ${GREEN}✅ start.ts: 存在${NC}"
    else
        echo -e "  ${RED}❌ start.ts: 不存在${NC}"
    fi
}

# 函数：检查网络和端口
check_network_status() {
    echo -e "${CYAN}🌐 网络状态:${NC}"
    
    # 检查常用端口是否被占用
    COMMON_PORTS=(3000 8000 8080 3001 5000)
    
    for port in "${COMMON_PORTS[@]}"; do
        if lsof -i :"$port" >/dev/null 2>&1; then
            PROCESS_INFO=$(lsof -i :"$port" -t 2>/dev/null | head -n1)
            if [[ -n "$PROCESS_INFO" ]]; then
                PROCESS_NAME=$(ps -p "$PROCESS_INFO" -o comm= 2>/dev/null || echo "未知")
                echo -e "  ${YELLOW}⚠️  端口 $port: 被占用 (进程: $PROCESS_NAME, PID: $PROCESS_INFO)${NC}"
            else
                echo -e "  ${YELLOW}⚠️  端口 $port: 被占用${NC}"
            fi
        else
            echo -e "  ${GREEN}✅ 端口 $port: 可用${NC}"
        fi
    done
}

# 函数：检查日志文件
check_logs() {
    echo -e "${CYAN}📝 日志状态:${NC}"
    
    cd "$PROJECT_DIR"
    
    # 检查日志目录
    if [[ -d "logs" ]]; then
        echo -e "  ${GREEN}✅ logs 目录: 存在${NC}"
        
        # 检查日志文件
        LOG_FILES=("logs/notice-mcp.log" "logs/error.log" "logs/access.log")
        
        for log_file in "${LOG_FILES[@]}"; do
            if [[ -f "$log_file" ]]; then
                LOG_SIZE=$(du -sh "$log_file" 2>/dev/null | cut -f1 || echo "未知")
                LOG_LINES=$(wc -l < "$log_file" 2>/dev/null || echo "未知")
                echo -e "    ${GREEN}✅ $log_file: 存在 (大小: $LOG_SIZE, 行数: $LOG_LINES)${NC}"
            else
                echo -e "    ${YELLOW}⚠️  $log_file: 不存在${NC}"
            fi
        done
    else
        echo -e "  ${YELLOW}⚠️  logs 目录: 不存在${NC}"
    fi
}

# 函数：显示快速操作提示
show_quick_actions() {
    echo -e "${PURPLE}🚀 快速操作:${NC}"
    echo -e "  ${GREEN}启动服务:${NC} ./scripts/start-macos.sh"
    echo -e "  ${RED}停止服务:${NC} ./scripts/stop-macos.sh"
    echo -e "  ${BLUE}查看状态:${NC} ./scripts/status-macos.sh"
    echo -e "  ${YELLOW}查看日志:${NC} tail -f logs/notice-mcp.log"
    echo -e "  ${CYAN}编辑配置:${NC} nano config.toml"
}

# 主流程
echo -e "${BLUE}🔍 开始检查 NoticeMCP 服务状态...${NC}"
echo

# 检查服务状态
SERVICE_RUNNING=false
if check_service_status; then
    SERVICE_RUNNING=true
fi

echo

# 检查系统环境
check_system_environment

echo

# 检查项目状态
check_project_status

echo

# 检查网络状态
check_network_status

echo

# 检查日志
check_logs

echo

# 显示总结
echo -e "${BLUE}📋 状态总结:${NC}"
if [[ "$SERVICE_RUNNING" == "true" ]]; then
    echo -e "  ${GREEN}🟢 NoticeMCP 服务正在运行${NC}"
else
    echo -e "  ${RED}🔴 NoticeMCP 服务未运行${NC}"
fi

echo

# 显示快速操作
show_quick_actions

echo
echo -e "${GREEN}✅ 状态检查完成！${NC}"