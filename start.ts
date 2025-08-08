#!/usr/bin/env node

/**
 * Notice MCP Server 启动脚本
 * 这个脚本提供了一个简化版本的MCP服务器，可以在没有完整依赖的情况下运行
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 类型声明
interface MCPRequest {
  method: string;
  params?: any;
  id?: string | number;
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

interface NotificationArgs {
  title: string;
  message: string;
}

interface BackendConfig {
  enabled?: boolean;
  webhook?: string[];
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

// ConfigManager类型将从导入的模块中获取

interface NotificationResult {
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

// 配置管理器全局变量
let configManager: any = null;

// 异步加载配置
async function loadConfig(): Promise<any> {
  try {
    const { ConfigManager } = await import('./src/config/manager.js');
    configManager = ConfigManager.getInstance();
    console.error('📋 配置文件已加载:', configManager.getConfigSummary());
    return configManager;
  } catch (error: any) {
    console.error('⚠️  配置文件加载失败，使用默认配置:', error.message);
    return null;
  }
}

// 简化的MCP协议处理
class SimpleMCPServer {
  private configManager: any;
  public tools: Tool[];

  constructor(configManager: any = null) {
    this.configManager = configManager;
    this.tools = [
      {
        name: 'send_notification',
        description: '发送通知消息到所有可用后端',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '通知标题'
            },
            message: {
              type: 'string', 
              description: '通知内容'
            }
          },
          required: ['title', 'message']
        }
      }
    ];
  }

  async handleRequest(request: MCPRequest): Promise<any> {
    const { method, params } = request;

    switch (method) {
      case 'tools/list':
        return {
          tools: this.tools
        };

      case 'tools/call':
        return await this.handleToolCall(params);

      case 'initialize':
        return {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'notice-mcp',
            version: '1.0.0'
          }
        };

      default:
        throw new Error(`未知方法: ${method}`);
    }
  }

  async handleToolCall(params: any): Promise<any> {
    const { name, arguments: args } = params;

    switch (name) {
      case 'send_notification':
        return await this.sendNotification(args);

      default:
        throw new Error(`未知工具: ${name}`);
    }
  }

  async sendNotification(args: NotificationArgs): Promise<any> {
    // 明确忽略backend参数，只提取需要的参数
    const { title, message } = args;
    
    console.log('📤 发送通知到所有启用的后端');
    
    // 始终发送到所有启用的后端
    return await this.sendToAllEnabledBackends(title, message);
  }

  async sendToAllEnabledBackends(title: string, message: string): Promise<any> {
    const availableBackends = ['macos', 'feishu'];
    const enabledBackends: string[] = [];
    
    // 检查哪些后端是启用的
    for (const backendName of availableBackends) {
      if (this.configManager) {
        const isEnabled = this.configManager.isBackendEnabled(backendName);
        
        if (isEnabled) {
          enabledBackends.push(backendName);
          console.log(`✅ 后端 ${backendName} 已启用`);
        } else {
          console.log(`❌ 后端 ${backendName} 未启用`);
        }
      } else {
        console.log(`❌ 后端 ${backendName} 未启用 (无配置管理器)`);
      }
    }
    
    if (enabledBackends.length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: '没有启用的后端',
            timestamp: new Date().toISOString()
          }, null, 2)
        }],
        isError: true
      };
    }
    
    const results: NotificationResult[] = [];
    
    // 并行发送到所有启用的后端
    const promises = enabledBackends.map(async (backendName): Promise<NotificationResult> => {
      try {
        // 使用配置文件中的配置
        let finalConfig: BackendConfig = {};
        if (this.configManager) {
          const backendConfig = this.configManager.getBackendConfig(backendName);
          if (backendConfig) {
            finalConfig = { ...backendConfig };
          }
        }
        
        let result: Partial<NotificationResult>;
        switch (backendName) {
          case 'feishu':
            result = await this.sendFeishu(title, message, finalConfig);
            break;
          case 'macos':
            result = await this.sendMacOS(title, message, finalConfig);
            break;
          default:
            throw new Error(`未知后端: ${backendName}`);
        }
        
        return {
          success: true,
          backend: backendName,
          timestamp: new Date().toISOString(),
          ...result
        };
      } catch (error: any) {
        console.error(`❌ ${backendName} 后端发送失败:`, error.message);
        console.error(`❌ 错误详情:`, error.stack);
        return {
          success: false,
          backend: backendName,
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    });
    
    const allResults = await Promise.all(promises);
    results.push(...allResults);
    
    console.error(`📤 消息已发送到 ${enabledBackends.length} 个后端: ${enabledBackends.join(', ')}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `通知已发送到 ${enabledBackends.length} 个启用的后端`,
          backends: enabledBackends,
          results: allResults,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async sendFeishu(title: string, message: string, config: any): Promise<Partial<NotificationResult>> {
    // 从配置中获取webhook URL - 支持多种格式
    let webhookUrls: string[] = [];
    if (config?.webhook && Array.isArray(config.webhook)) {
      // 格式1：webhook 数组
      webhookUrls = config.webhook;
    } else if (config?.webhooks && Array.isArray(config.webhooks)) {
      // 格式2：webhooks 数组
      webhookUrls = config.webhooks;
    } else if (config?.webhooks && typeof config.webhooks === 'object') {
      // 格式3：webhooks 对象
      webhookUrls = Object.values(config.webhooks);
    }
    
    if (!config || !Array.isArray(webhookUrls) || webhookUrls.length === 0) {
      throw new Error('飞书配置无效，需要提供有效的webhook数组');
    }

    // 验证所有webhook URL格式
    for (const url of webhookUrls) {
      if (!url.includes('open.feishu.cn')) {
        throw new Error(`飞书webhookUrl格式无效: ${url}`);
      }
    }

    // 如果所有URL都是占位符，返回模拟响应
    if (webhookUrls.every(url => url.includes('YOUR_WEBHOOK_TOKEN'))) {
      return {
        messageId: `feishu-${Date.now()}`,
        platform: 'feishu',
        status: 'simulated',
        note: '使用占位符URL，实际未发送到飞书',
        webhookCount: webhookUrls.length
      };
    }

    // 构建飞书消息格式
    const payload: any = {
      msg_type: 'interactive',
      card: {
        elements: [
          {
            tag: 'div',
            text: {
              content: `**${title}**\n\n${message}`,
              tag: 'lark_md'
            }
          }
        ],
        header: {
          title: {
            content: title,
            tag: 'plain_text'
          },
          template: 'blue'
        }
      }
    };

    // 添加@功能
    if (config.atAll) {
      payload.card.elements.push({
        tag: 'div',
        text: {
          content: '<at user_id="all">所有人</at>',
          tag: 'lark_md'
        }
      });
    }

    if (config.atUserIds && config.atUserIds.length > 0) {
      const atUsers = config.atUserIds.map(userId => `<at user_id="${userId}"></at>`).join(' ');
      payload.card.elements.push({
        tag: 'div',
        text: {
          content: atUsers,
          tag: 'lark_md'
        }
      });
    }

    // 如果有签名密钥，生成签名
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.secret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `${timestamp}\n${config.secret}`;
      const crypto = await import('crypto');
      const sign = crypto.createHmac('sha256', stringToSign).digest('base64');
      
      payload.timestamp = timestamp;
      payload.sign = sign;
    }

    // 并行发送到所有webhook URL
    const sendPromises = webhookUrls.map(async (webhookUrl: string, index: number) => {
      try {
        // 如果是占位符URL，跳过实际发送
        if (webhookUrl.includes('YOUR_WEBHOOK_TOKEN')) {
          return {
            success: true,
            webhookIndex: index,
            webhookUrl,
            status: 'simulated',
            note: '占位符URL，未实际发送'
          };
        }

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`飞书API错误: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (result.code !== 0) {
          throw new Error(`飞书发送失败: ${result.msg}`);
        }

        console.error(`[FEISHU] 消息已发送到webhook ${index + 1}`);
        return {
          success: true,
          webhookIndex: index,
          webhookUrl,
          response: result
        };
      } catch (error: any) {
        console.error(`[FEISHU] webhook ${index + 1} 发送失败: ${error.message}`);
        return {
          success: false,
          webhookIndex: index,
          webhookUrl,
          error: error.message
        };
      }
    });

    try {
      const results = await Promise.all(sendPromises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      console.error(`[FEISHU] 标题: ${title}`);
      console.error(`[FEISHU] 发送结果: ${successCount}成功, ${failureCount}失败`);

      // 如果至少有一个成功，则认为发送成功
      if (successCount === 0) {
        const errors = results.filter(r => !r.success).map(r => r.error).join('; ');
        throw new Error(`所有飞书webhook发送失败: ${errors}`);
      }

      return {
        messageId: `feishu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        platform: 'feishu',
        results,
        successCount,
        failureCount,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`飞书发送失败: ${error.message}`);
    }
  }

  async sendMacOS(title: string, message: string, config: BackendConfig = {}): Promise<Partial<NotificationResult>> {
    try {
      
      // 动态导入 node-notifier
      let notifier: any;
      try {
        const nodeNotifierModule = await import('node-notifier');
        notifier = nodeNotifierModule.default;
      } catch (importError) {
        throw new Error('node-notifier not available - please install node-notifier package');
      }
      
      // 构建 node-notifier 选项
      const notificationOptions: any = {
        title: title,
        message: message,
        sound: config.sound || true, // true 表示使用默认声音
        wait: config.wait || false,
        timeout: config.timeout !== undefined ? config.timeout : false // false 表示常驻通知
      };
      
      // 添加可选参数
      if (config.subtitle) {
        notificationOptions.subtitle = config.subtitle;
      }
      
      if (config.appIcon) {
        notificationOptions.appIcon = config.appIcon;
      }
      
      if (config.contentImage) {
        notificationOptions.contentImage = config.contentImage;
      }
      
      if (config.open) {
        notificationOptions.open = config.open;
      }
      
      // 使用 Promise 包装 node-notifier 的回调
      await new Promise<void>((resolve, reject) => {
        notifier.notify(notificationOptions, (err: any, response: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      return {
        messageId: `macos-${Date.now()}`,
        platform: 'macos',
        sound: config.sound || 'default',
        timeout: config.timeout !== undefined ? config.timeout : false
      };
      
    } catch (error: any) {
      throw new Error(`MacOS通知发送失败: ${error.message}`);
    }
  }
}

// STDIO MCP 协议处理
class StdioMCPTransport {
  private server: SimpleMCPServer;

  constructor(server: SimpleMCPServer) {
    this.server = server;
    this.setupStdio();
  }

  setupStdio(): void {
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    process.stdin.on('data', (chunk: string) => {
      buffer += chunk;
      
      // 处理完整的JSON-RPC消息
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留不完整的行
      
      for (const line of lines) {
        if (line.trim()) {
          this.handleMessage(line.trim());
        }
      }
    });

    process.stdin.on('end', () => {
      if (buffer.trim()) {
        this.handleMessage(buffer.trim());
      }
    });
  }

  async handleMessage(message: string): Promise<void> {
    let request: MCPRequest | null = null;
    try {
      request = JSON.parse(message) as MCPRequest;
      const response = await this.server.handleRequest(request);
      
      const jsonResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id || null,
        result: response
      };
      
      process.stdout.write(JSON.stringify(jsonResponse) + '\n');
    } catch (error: any) {
      const errorResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: request?.id || null,
        error: {
          code: -32603,
          message: error.message
        }
      };
      
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
}

// 启动服务器
async function startServer(): Promise<void> {
  console.error('🚀 Notice MCP Server 启动中...');
  
  // 加载配置
  const config = await loadConfig();
  
  const server = new SimpleMCPServer(config);
  const transport = new StdioMCPTransport(server);
  
  console.error('✅ Notice MCP Server 已启动，等待连接...');
  console.error('📋 可用工具:', server.tools.map(t => t.name).join(', '));
  
  if (config) {
    console.error('⚙️  使用TOML配置文件');
  } else {
    console.error('⚙️  使用默认配置');
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { SimpleMCPServer, StdioMCPTransport };