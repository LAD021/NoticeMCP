#!/usr/bin/env node

/**
 * Notice MCP Server 主入口
 */

import { SimpleMCPServer } from './mcp/server.js';
import { StdioMCPTransport } from './mcp/transport.js';
import { loadConfig } from './config/loader.js';

/**
 * 启动服务器
 */
export async function startServer(): Promise<void> {
  const config = await loadConfig();
  
  const server = new SimpleMCPServer(config);
  const transport = new StdioMCPTransport(server);
  
  console.error('✅ Notice MCP Server 已启动，等待连接...');
  console.error(`📋 可用工具: ${server.tools.map(t => t.name).join(', ')}`);
  
  if (config) {
    console.error('⚙️  使用TOML配置文件');
  } else {
    console.error('⚙️  使用默认配置');
  }
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { SimpleMCPServer, StdioMCPTransport };