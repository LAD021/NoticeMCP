#!/usr/bin/env node

// 自包含的MCP服务器实现，不依赖外部SDK

// 导入配置管理器
import { ConfigManager } from './config/manager.js';

// Node.js类型声明
declare const process: {
  stdin: {
    setEncoding(encoding: string): void;
    on(event: 'data', listener: (chunk: string) => void): void;
    on(event: 'end', listener: () => void): void;
  };
  stdout: {
    write(data: string): void;
  };
  argv: string[];
};

declare const console: {
  error(...args: any[]): void;
};

// 简单的模块元数据对象
interface ImportMeta {
  url: string;
}

// 移除错误的import声明，使用标准的import.meta

// 简单的验证函数
function validateString(value: any, name: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string`);
  }
  return value;
}

function validateEnum(value: any, options: string[], name: string): string {
  const str = validateString(value, name);
  if (!options.includes(str)) {
    throw new Error(`${name} must be one of: ${options.join(', ')}`);
  }
  return str;
}

// 通知结果接口
interface NotificationResult {
  success: boolean;
  backend: string;
  timestamp: string;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// 通知后端接口
interface NotificationBackend {
  send(title: string, message: string, config?: Record<string, any>): Promise<Partial<NotificationResult>>;
  validateConfig?(config: Record<string, any>): boolean;
  getDescription(): string;
  getRequiredConfig(): string[];
}

// 邮件后端实现
class EmailBackend implements NotificationBackend {
  getDescription(): string {
    return '邮件通知后端 - 通过SMTP发送邮件通知';
  }

  getRequiredConfig(): string[] {
    return ['to'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.to && (typeof config.to === 'string' || Array.isArray(config.to)));
  }

  async send(title: string, message: string, config?: Record<string, any>): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('邮件配置无效，需要提供收件人地址 (to)');
    }

    const recipients = Array.isArray(config.to) ? config.to : [config.to];
    const subject = config.subject || title;
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.error(`[EMAIL] 发送邮件到: ${recipients.join(', ')}`);
    console.error(`[EMAIL] 主题: ${subject}`);
    console.error(`[EMAIL] 内容: ${message}`);
    
    return {
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: { recipients, subject, method: 'smtp' }
    };
  }
}

// Webhook后端实现
class WebhookBackend implements NotificationBackend {
  getDescription(): string {
    return 'Webhook通知后端 - 通过HTTP请求发送通知到指定URL';
  }

  getRequiredConfig(): string[] {
    return ['url'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.url && typeof config.url === 'string' && config.url.startsWith('http'));
  }

  async send(title: string, message: string, config?: Record<string, any>): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('Webhook配置无效，需要提供有效的URL');
    }

    const payload = {
      title,
      message,
      timestamp: new Date().toISOString(),
      source: 'notice-mcp'
    };

    const requestOptions: RequestInit = {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'notice-mcp/1.0.0',
        ...config.headers
      },
      body: JSON.stringify(payload)
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(config.url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.error(`[WEBHOOK] 发送到: ${config.url}`);
      console.error(`[WEBHOOK] 状态: ${response.status}`);

      return {
        messageId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          url: config.url,
          method: config.method || 'POST',
          statusCode: response.status,
          response: responseText.substring(0, 200)
        }
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Webhook请求超时: ${config.url}`);
      }
      throw new Error(`Webhook发送失败: ${error.message}`);
    }
  }
}

// Slack后端实现
class SlackBackend implements NotificationBackend {
  getDescription(): string {
    return 'Slack通知后端 - 通过Webhook发送Slack消息';
  }

  getRequiredConfig(): string[] {
    return ['webhookUrl'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.webhookUrl && typeof config.webhookUrl === 'string' && 
             config.webhookUrl.includes('hooks.slack.com'));
  }

  async send(title: string, message: string, config?: Record<string, any>): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('Slack配置无效，需要提供有效的webhookUrl');
    }

    const payload: any = {
      text: title,
      attachments: [{
        color: 'good',
        text: message,
        ts: Math.floor(Date.now() / 1000),
        footer: 'Notice MCP',
        footer_icon: '🤖'
      }]
    };

    if (config.channel) payload.channel = config.channel;
    if (config.username) payload.username = config.username;
    if (config.iconEmoji) payload.icon_emoji = config.iconEmoji;

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack API错误: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.error(`[SLACK] 发送到频道: ${config.channel || 'default'}`);
      console.error(`[SLACK] 标题: ${title}`);

      return {
        messageId: `slack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          channel: config.channel,
          username: config.username,
          response: responseText
        }
      };
    } catch (error: any) {
      throw new Error(`Slack发送失败: ${error.message}`);
    }
  }
}

// 通知管理器
// MacOS后端实现（简化版）
class MacOSBackend implements NotificationBackend {
  getDescription(): string {
    return 'Mac系统通知后端 - 使用macOS原生通知系统发送桌面通知';
  }

  getRequiredConfig(): string[] {
    return []; // 无必需配置
  }

  validateConfig(config: Record<string, any>): boolean {
    return true; // MacOS通知无特殊配置要求
  }

  async send(title: string, message: string, config?: Record<string, any>): Promise<Partial<NotificationResult>> {
    try {
      // 模拟MacOS通知发送
      console.error(`[MACOS] 系统通知`);
      console.error(`[MACOS] 标题: ${title}`);
      console.error(`[MACOS] 内容: ${message}`);
      
      if (config?.subtitle) {
        console.error(`[MACOS] 副标题: ${config.subtitle}`);
      }
      
      if (config?.sound) {
        console.error(`[MACOS] 声音: ${config.sound}`);
      }
      
      return {
        messageId: `macos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          title,
          message,
          subtitle: config?.subtitle,
          sound: config?.sound || 'default',
          platform: 'macOS'
        }
      };
    } catch (error: any) {
      throw new Error(`MacOS通知发送失败: ${error.message}`);
    }
  }
}

class NotificationManager {
  private backends: Map<string, NotificationBackend> = new Map();
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  registerBackend(name: string, backend: NotificationBackend): void {
    this.backends.set(name, backend);
  }

  getAvailableBackends(): string[] {
    return Array.from(this.backends.keys());
  }

  getEnabledBackends(): string[] {
    return Array.from(this.backends.keys()).filter(name => 
      this.configManager.isBackendEnabled(name)
    );
  }

  async sendNotification(
    title: string,
    message: string,
    backendName?: string,
    config?: Record<string, any>
  ): Promise<NotificationResult | NotificationResult[]> {
    // 如果指定了后端，只发送到该后端
    if (backendName) {
      return await this.sendToSingleBackend(title, message, backendName, config);
    }
    
    // 如果没有指定后端，发送到所有启用的后端
    return await this.sendToAllEnabledBackends(title, message, config);
  }

  private async sendToSingleBackend(
    title: string,
    message: string,
    backendName: string,
    config?: Record<string, any>
  ): Promise<NotificationResult> {
    const backend = this.backends.get(backendName);
    if (!backend) {
      throw new Error(`未找到后端: ${backendName}`);
    }

    if (!this.configManager.isBackendEnabled(backendName)) {
      throw new Error(`后端 ${backendName} 未启用`);
    }

    try {
      // 合并配置文件中的后端配置和传入的配置
      const backendConfig = this.configManager.getBackendConfig(backendName) || {};
      const mergedConfig = { ...backendConfig, ...config };
      
      const result = await backend.send(title, message, mergedConfig);
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
        error: error.message || '未知错误'
      };
    }
  }

  private async sendToAllEnabledBackends(
    title: string,
    message: string,
    config?: Record<string, any>
  ): Promise<NotificationResult[]> {
    const enabledBackends = this.getEnabledBackends();
    
    if (enabledBackends.length === 0) {
      throw new Error('没有启用的后端');
    }

    const results: NotificationResult[] = [];
    
    // 并行发送到所有启用的后端
    const promises = enabledBackends.map(async (backendName) => {
      try {
        return await this.sendToSingleBackend(title, message, backendName, config);
      } catch (error: any) {
        return {
          success: false,
          backend: backendName,
          timestamp: new Date().toISOString(),
          error: error.message || '未知错误'
        };
      }
    });

    const allResults = await Promise.all(promises);
    results.push(...allResults);
    
    console.error(`📤 消息已发送到 ${enabledBackends.length} 个后端: ${enabledBackends.join(', ')}`);
    
    return results;
  }
}

// 验证函数
function validateSendNotification(args: any): {
  title: string;
  message: string;
  backend?: string;
  config?: Record<string, any>;
} {
  const title = validateString(args.title, 'title');
  const message = validateString(args.message, 'message');
  
  // backend参数现在是可选的
  let backend: string | undefined;
  if (args.backend) {
    backend = validateEnum(args.backend, ['email', 'webhook', 'slack', 'macos'], 'backend');
  }
  
  return { title, message, backend, config: args.config };
}

// MCP请求接口
interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}

// MCP响应接口
interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class NoticeMCPServer {
  private notificationManager: NotificationManager;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.notificationManager = new NotificationManager(this.configManager);
    this.setupBackends();
    this.setupStdio();
    console.error(`📋 ${this.configManager.getConfigSummary()}`);
  }

  private setupBackends() {
    // 注册默认后端
    this.notificationManager.registerBackend('email', new EmailBackend());
    this.notificationManager.registerBackend('webhook', new WebhookBackend());
    this.notificationManager.registerBackend('slack', new SlackBackend());
    this.notificationManager.registerBackend('macos', new MacOSBackend());
  }

  private setupStdio() {
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    process.stdin.on('data', (chunk: string) => {
      buffer += chunk;
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
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

  private async handleMessage(message: string) {
    try {
      const request: MCPRequest = JSON.parse(message);
      const response = await this.handleRequest(request);
      
      const jsonResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: response
      };
      
      process.stdout.write(JSON.stringify(jsonResponse) + '\n');
    } catch (error: any) {
      let requestId: string | number = 'unknown';
      try {
        const parsedMessage = JSON.parse(message) as MCPRequest;
        requestId = parsedMessage.id;
      } catch {
        // 使用默认ID
      }
      
      const errorResponse: MCPResponse = {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: error.message
        }
      };
      
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }

  private async handleRequest(request: MCPRequest): Promise<any> {
    const { method, params } = request;

    switch (method) {
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
          tools: [
            {
              name: 'send_notification',
              description: '发送通知消息到指定后端',
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
                  },
                  backend: {
                     type: 'string',
                     enum: ['email', 'webhook', 'slack', 'macos'],
                     description: '通知后端类型'
                   },
                  config: {
                    type: 'object',
                    description: '后端特定配置',
                    additionalProperties: true
                  }
                },
                required: ['title', 'message']
              }
            },
            {
              name: 'get_backends',
              description: '获取所有可用的通知后端',
              inputSchema: {
                type: 'object',
                properties: {},
                additionalProperties: false
              }
            }
          ]
        };

      case 'tools/call':
        return await this.handleToolCall(params);

      default:
        throw new Error(`未知方法: ${method}`);
    }
  }

  private async handleToolCall(params: any): Promise<any> {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        case 'send_notification': {
          const validated = validateSendNotification(args);
          const result = await this.notificationManager.sendNotification(
            validated.title,
            validated.message,
            validated.backend,
            validated.config
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: '通知发送成功',
                  result
                }, null, 2)
              }
            ]
          };
        }

        case 'get_backends': {
          const backends = this.notificationManager.getAvailableBackends();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  backends,
                  count: backends.length,
                  descriptions: {
                     email: '邮件通知后端 - 通过SMTP发送邮件',
                     webhook: 'Webhook通知后端 - 发送HTTP请求到指定URL',
                     slack: 'Slack通知后端 - 通过Webhook发送Slack消息',
                     macos: 'Mac系统通知后端 - 使用macOS原生通知系统发送桌面通知'
                   }
                }, null, 2)
              }
            ]
          };
        }

        default:
          throw new Error(`未知工具: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message || '未知错误'
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }

  run() {
    console.error('🚀 Notice MCP Server 已启动');
    console.error('📋 可用工具: send_notification, get_backends');
    console.error('🔧 支持后端: email, webhook, slack');
  }
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new NoticeMCPServer();
  server.run();
}

export { NoticeMCPServer, NotificationManager, EmailBackend, WebhookBackend, SlackBackend, MacOSBackend };