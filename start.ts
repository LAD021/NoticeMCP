#!/usr/bin/env node

/**
 * Notice MCP Server 启动脚本
 * 这个脚本提供了一个简化版本的MCP服务器，可以在没有完整依赖的情况下运行
 */

import { startServer, SimpleMCPServer, StdioMCPTransport } from './src/main.js';

// 兼容性类型导出
export interface BackendConfig {
  enabled?: boolean;
  webhook?: string[];
  webhooks?: string[] | Record<string, string>;
  secret?: string;
  atAll?: boolean;
  atUserIds?: string[];
  sound?: string;
  subtitle?: string;
  appIcon?: string;
  contentImage?: string;
  open?: string;
  wait?: boolean;
  timeout?: number | false;
}

export interface NotificationResult {
  success: boolean;
  backend: string;
  timestamp: string;
  messageId?: string;
  error?: string;
  platform?: string;
  results?: any[];
  successCount?: number;
  failureCount?: number;
  webhookCount?: number;
  status?: string;
  note?: string;
  sound?: string;
  timeout?: number | false;
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { SimpleMCPServer, StdioMCPTransport, startServer };