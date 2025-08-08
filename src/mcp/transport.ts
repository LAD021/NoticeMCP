/**
 * MCP传输层实现
 */

import { SimpleMCPServer, MCPRequest, MCPResponse } from './server.js';

export class StdioMCPTransport {
  private server: SimpleMCPServer;

  constructor(server: SimpleMCPServer) {
    this.server = server;
    this.setupStdio();
  }

  setupStdio(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (data: string) => {
      const lines = data.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          this.handleMessage(line.trim());
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });

    process.on('SIGINT', () => {
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      process.exit(0);
    });
  }

  async handleMessage(message: string): Promise<void> {
    try {
      const request: MCPRequest = JSON.parse(message);
      const result = await this.server.handleRequest(request);
      
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id || null,
        result
      };
      
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (error: any) {
      const errorResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -1,
          message: error.message || '未知错误'
        }
      };
      
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
}