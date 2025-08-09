#!/bin/bash

# NoticeMCP - macOS 停止服务脚本

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

echo -e "${BLUE}🛑 NoticeMCP - macOS 停止服务脚本${NC}"
echo "=" | tr '=' '=' | head -c 50 && echo
echo -e "${BLUE}📁 项目目录: $PROJECT_DIR${NC}"
echo

# 检查是否为macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ 错误: 此脚本仅支持 macOS 系统${NC}"
    exit 1
fi

# 函数：停止服务
stop_service() {
    echo -e "${YELLOW}🔍 正在查找 NoticeMCP 服务进程...${NC}"
    
    # 查找相关进程
    PIDS=$(pgrep -f "tsx start.ts" 2>/dev/null || true)
    
    if [[ -z "$PIDS" ]]; then
        echo -e "${YELLOW}⚠️  未找到运行中的 NoticeMCP 服务${NC}"
        return 0
    fi
    
    echo -e "${BLUE}📋 找到以下进程:${NC}"
    echo "$PIDS" | while read -r pid; do
        if [[ -n "$pid" ]]; then
            echo -e "  ${YELLOW}PID: $pid${NC}"
        fi
    done
    
    echo -e "${YELLOW}🛑 正在停止服务...${NC}"
    
    # 优雅停止
    echo "$PIDS" | while read -r pid; do
        if [[ -n "$pid" ]]; then
            echo -e "  ${BLUE}正在停止进程 $pid...${NC}"
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # 等待进程结束
    sleep 3
    
    # 检查是否还有进程在运行
    REMAINING_PIDS=$(pgrep -f "tsx start.ts" 2>/dev/null || true)
    
    if [[ -n "$REMAINING_PIDS" ]]; then
        echo -e "${YELLOW}⚠️  部分进程未能优雅停止，正在强制终止...${NC}"
        echo "$REMAINING_PIDS" | while read -r pid; do
            if [[ -n "$pid" ]]; then
                echo -e "  ${RED}强制终止进程 $pid...${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi
        done
        sleep 2
    fi
    
    # 最终检查
    FINAL_CHECK=$(pgrep -f "tsx start.ts" 2>/dev/null || true)
    
    if [[ -z "$FINAL_CHECK" ]]; then
        echo -e "${GREEN}✅ NoticeMCP 服务已成功停止${NC}"
    else
        echo -e "${RED}❌ 部分进程可能仍在运行，请手动检查${NC}"
        echo -e "${YELLOW}💡 可以使用以下命令查看: ps aux | grep tsx${NC}"
        return 1
    fi
}

# 函数：清理临时文件
cleanup_temp_files() {
    echo -e "${YELLOW}🧹 清理临时文件...${NC}"
    
    cd "$PROJECT_DIR"
    
    # 清理可能的锁文件
    if [[ -f ".npm-lock" ]]; then
        rm -f ".npm-lock"
        echo -e "  ${GREEN}✅ 已清理 npm 锁文件${NC}"
    fi
    
    # 清理可能的 PID 文件
    if [[ -f "notice-mcp.pid" ]]; then
        rm -f "notice-mcp.pid"
        echo -e "  ${GREEN}✅ 已清理 PID 文件${NC}"
    fi
    
    echo -e "${GREEN}✅ 临时文件清理完成${NC}"
}

# 函数：显示服务状态
show_status() {
    echo -e "${BLUE}📊 服务状态检查:${NC}"
    
    RUNNING_PIDS=$(pgrep -f "tsx start.ts" 2>/dev/null || true)
    
    if [[ -z "$RUNNING_PIDS" ]]; then
        echo -e "  ${GREEN}✅ NoticeMCP 服务: 已停止${NC}"
    else
        echo -e "  ${RED}❌ NoticeMCP 服务: 仍在运行${NC}"
        echo "$RUNNING_PIDS" | while read -r pid; do
            if [[ -n "$pid" ]]; then
                echo -e "    ${YELLOW}PID: $pid${NC}"
            fi
        done
    fi
}

# 主流程
echo -e "${BLUE}🔍 开始停止 NoticeMCP 服务...${NC}"
echo

# 停止服务
stop_service

echo

# 清理临时文件
cleanup_temp_files

echo

# 显示最终状态
show_status

echo
echo -e "${GREEN}🎉 NoticeMCP 停止操作完成！${NC}"
echo -e "${BLUE}💡 提示:${NC}"
echo -e "  - 使用 ${GREEN}./scripts/start-macos.sh${NC} 重新启动服务"
echo -e "  - 使用 ${GREEN}./scripts/status-macos.sh${NC} 查看服务状态"
echo -e "  - 配置文件位于 ${GREEN}config.toml${NC}"