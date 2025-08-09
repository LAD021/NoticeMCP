#!/usr/bin/env node

/**
 * MCP服务器核心实现
 */

import { ConfigManager } from '../config/manager.js';
import { NotificationManager } from '../notification/manager.js';
import { FeishuBackend } from '../backends/feishu.js';
import { MacOSBackend } from '../backends/macos.js';

// 类型声明
export interface MCPRequest {
  method: string;
  params?: any;
  id?: string | number;
}

export interface MCPResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface NotificationArgs {
  title: string;
  message: string;
}

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

export class SimpleMCPServer {
  private configManager: ConfigManager | null;
  private notificationManager: NotificationManager;
  public tools: Tool[];

  constructor(configManager: ConfigManager | null = null) {
    this.configManager = configManager;
    this.notificationManager = new NotificationManager();
    
    // 注册后端
    this.notificationManager.registerBackend('feishu', new FeishuBackend());
    this.notificationManager.registerBackend('macos', new MacOSBackend());
    
    this.tools = [
      {
        name: 'send_notification',
        description: '发送通知到所有配置的后端（macOS 和/或 飞书）',
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
    switch (request.method) {
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
      
      case 'tools/list':
        return {
          tools: this.tools
        };
      
      case 'tools/call':
        if (request.params?.name === 'send_notification') {
          return await this.handleToolCall(request.params);
        }
        throw new Error(`未知工具: ${request.params?.name}`);
      
      default:
        throw new Error(`未支持的方法: ${request.method}`);
    }
  }

  async handleToolCall(params: any): Promise<any> {
    const { arguments: args } = params;
    
    if (!args.title || !args.message) {
      throw new Error('缺少必需参数: title 和 message');
    }
    
    return await this.sendNotification(args);
  }



  async sendNotification(args: NotificationArgs): Promise<any> {
    const { title, message } = args;
    
    console.log('📤 发送通知到所有启用的后端');
    return await this.sendToAllEnabledBackends(title, message);
  }



  async sendToAllEnabledBackends(title: string, message: string): Promise<any> {
    const availableBackends = ['macos', 'feishu'];
    const enabledBackends: string[] = [];
    const results: any[] = [];
    
    // 检查哪些后端是启用的
    for (const backendName of availableBackends) {
      if (this.configManager) {
        const isEnabled = this.configManager.isBackendEnabled(backendName);
        
        if (isEnabled) {
          console.log(`✅ 后端 ${backendName} 已启用`);
          enabledBackends.push(backendName);
        }
      }
    }
    
    if (enabledBackends.length === 0) {
      console.warn('⚠️ 没有启用的后端');
      return {
        success: false,
        results: []
      };
    }
    
    // 并行发送到所有启用的后端
    const promises = enabledBackends.map(async (backendName) => {
      try {
        const finalConfig = this.configManager ? 
          this.configManager.getBackendConfig(backendName) : {};
        
        let result: Partial<NotificationResult>;
        switch (backendName) {
          case 'feishu':
            result = await this.sendFeishu(title, message, finalConfig);
            break;
          case 'macos':
            result = await this.sendMacOS(title, message, finalConfig);
            break;
          default:
            throw new Error(`不支持的后端: ${backendName}`);
        }
        
        return {
          success: true,
          backend: backendName,
          timestamp: new Date().toISOString(),
          ...result
        };
      } catch (error: any) {
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
      success: results.some(r => r.success),
      results: allResults
    };
  }

  async sendFeishu(title: string, message: string, config: any): Promise<Partial<NotificationResult>> {
    // 从配置中获取webhook URL - 支持多种格式
    let webhookUrls: string[] = [];
    
    if (config.webhook && Array.isArray(config.webhook)) {
      // 格式1: webhook 数组
      webhookUrls = config.webhook;
    } else if (config.webhooks && Array.isArray(config.webhooks)) {
      // 格式2: webhooks 数组
      webhookUrls = config.webhooks;
    } else if (config.webhooks && typeof config.webhooks === 'object') {
      // 格式3: webhooks 对象
      webhookUrls = Object.values(config.webhooks);
    }
    
    if (!config || !Array.isArray(webhookUrls) || webhookUrls.length === 0) {
      throw new Error('飞书配置无效，需要提供有效的webhook数组');
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

    // 添加@所有人
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
      const atUsers = config.atUserIds.map((userId: string) => `<at user_id="${userId}"></at>`).join(' ');
      payload.card.elements.push({
        tag: 'div',
        text: {
          content: atUsers,
          tag: 'lark_md'
        }
      });
    }

    // 添加签名（如果配置了secret）
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

    // 发送到所有webhook
    const sendPromises = webhookUrls.map(async (webhookUrl: string, index: number) => {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        
        const responseData = await response.json();
        
        return {
          success: response.ok && responseData.StatusCode === 0,
          webhookIndex: index,
          webhookUrl,
          response: responseData
        };
      } catch (error: any) {
        return {
          success: false,
          webhookIndex: index,
          webhookUrl,
          error: error.message
        };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    if (successCount > 0) {
      console.log(`[FEISHU] 消息已发送到webhook ${successCount}`);
      console.log(`[FEISHU] 标题: ${title}`);
      console.log(`[FEISHU] 发送结果: ${successCount}成功, ${failureCount}失败`);
      
      return {
        messageId: `feishu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        platform: 'feishu',
        results,
        successCount,
        failureCount
      };
    } else {
      throw new Error(`飞书发送失败: ${results.map(r => r.error || '未知错误').join(', ')}`);
    }
  }

  async sendMacOS(title: string, message: string, config: BackendConfig = {}): Promise<Partial<NotificationResult>> {
    try {
      
      // 动态导入 node-notifier
      let notifier: any;
      try {
        const nodeNotifierModule = await import('node-notifier') as any;
        notifier = nodeNotifierModule.default;
      } catch (importError) {
        throw new Error('node-notifier not available - please install node-notifier package');
      }
      
      // 构建通知选项
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
        notifier.default.notify(notificationOptions, (err: any, response: any) => {
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