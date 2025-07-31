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

// 配置管理器全局变量
let configManager = null;

// 异步加载配置
async function loadConfig() {
  try {
    const { ConfigManager } = await import('./src/config/manager.js');
    configManager = new ConfigManager();
    await configManager.loadConfig();
    console.error('📋 配置文件已加载:', configManager.getConfigSummary());
    return configManager;
  } catch (error) {
    console.error('⚠️  配置文件加载失败，使用默认配置:', error.message);
    return null;
  }
}

// 简化的MCP协议处理
class SimpleMCPServer {
  constructor(configManager = null) {
    this.configManager = configManager;
    this.tools = [
      {
        name: 'send_notification',
        description: '发送通知消息到指定后端',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '通知标题' },
            message: { type: 'string', description: '通知内容' },
            backend: { type: 'string', enum: ['email', 'webhook', 'slack', 'macos'], description: '通知后端类型' },
            config: { type: 'object', description: '后端特定配置' }
          },
          required: ['title', 'message', 'backend']
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
    ];
  }

  async handleRequest(request) {
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

  async handleToolCall(params) {
    const { name, arguments: args } = params;

    switch (name) {
      case 'send_notification':
        return await this.sendNotification(args);
      
      case 'get_backends':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              backends: ['email', 'webhook', 'slack', 'macos'],
              count: 4,
              descriptions: {
                email: '邮件通知后端 - 通过SMTP发送邮件',
                webhook: 'Webhook通知后端 - 发送HTTP请求到指定URL',
                slack: 'Slack通知后端 - 通过Webhook发送Slack消息',
                macos: 'Mac系统通知后端 - 使用macOS原生通知系统发送桌面通知'
              }
            }, null, 2)
          }]
        };

      default:
        throw new Error(`未知工具: ${name}`);
    }
  }

  async sendNotification(args) {
    const { title, message, backend, config = {} } = args;
    
    // 合并配置文件中的配置
    let finalConfig = { ...config };
    if (this.configManager) {
      const backendConfig = this.configManager.getBackendConfig(backend);
      if (backendConfig) {
        finalConfig = { ...backendConfig, ...config };
      }
    }
    
    try {
      let result;
      
      switch (backend) {
        case 'email':
          result = await this.sendEmail(title, message, finalConfig);
          break;
        case 'webhook':
          result = await this.sendWebhook(title, message, finalConfig);
          break;
        case 'slack':
          result = await this.sendSlack(title, message, finalConfig);
          break;
        case 'macos':
          result = await this.sendMacOS(title, message, finalConfig);
          break;
        default:
          throw new Error(`不支持的后端: ${backend}`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: '通知发送成功',
            backend,
            timestamp: new Date().toISOString(),
            ...result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            backend,
            timestamp: new Date().toISOString()
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  async sendEmail(title, message, config) {
    // 模拟邮件发送
    console.error(`[EMAIL] 发送邮件: ${title}`);
    console.error(`[EMAIL] 收件人: ${config.to || 'default@example.com'}`);
    console.error(`[EMAIL] 内容: ${message.substring(0, 100)}...`);
    
    // 在实际应用中，这里应该集成真实的邮件服务
    return {
      messageId: `email_${Date.now()}`,
      recipient: config.to || 'default@example.com',
      method: 'smtp'
    };
  }

  async sendWebhook(title, message, config) {
    const url = config.url;
    if (!url) {
      throw new Error('Webhook配置缺少URL');
    }

    console.error(`[WEBHOOK] 发送到: ${url}`);
    console.error(`[WEBHOOK] 标题: ${title}`);
    
    const payload = {
      title,
      message,
      timestamp: new Date().toISOString(),
      source: 'notice-mcp'
    };

    try {
      const response = await fetch(url, {
        method: config.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        messageId: `webhook_${Date.now()}`,
        url,
        statusCode: response.status
      };
    } catch (error) {
      throw new Error(`Webhook发送失败: ${error.message}`);
    }
  }

  async sendSlack(title, message, config) {
    const webhookUrl = config.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Slack配置缺少webhookUrl');
    }

    console.error(`[SLACK] 发送到频道: ${config.channel || 'default'}`);
    console.error(`[SLACK] 标题: ${title}`);

    const payload = {
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
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack API错误: ${response.status} - ${errorText}`);
      }

      return {
        messageId: `slack_${Date.now()}`,
        channel: config.channel,
        response: await response.text()
      };
    } catch (error) {
      throw new Error(`Slack发送失败: ${error.message}`);
    }
  }

  async sendMacOS(title, message, config = {}) {
    try {
      // 动态导入 node-notifier
      let notifier;
      try {
        const nodeNotifierModule = await import('node-notifier');
        notifier = nodeNotifierModule.default;
      } catch (importError) {
        throw new Error('node-notifier not available - please install node-notifier package');
      }
      
      // 构建 node-notifier 选项
      const notificationOptions = {
        title: title,
        message: message,
        sound: config.sound || true, // true 表示使用默认声音
        wait: config.wait || false,
        timeout: config.timeout || 5
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
      
      console.log(`[MacOS通知] 发送通知:`, notificationOptions);
      
      // 使用 Promise 包装 node-notifier 的回调
      await new Promise((resolve, reject) => {
        notifier.notify(notificationOptions, (err, response) => {
          if (err) {
            reject(err);
          } else {
            console.log(`[MacOS通知] 通知响应:`, response);
            resolve();
          }
        });
      });
      
      return {
        messageId: `macos-${Date.now()}`,
        platform: 'macos',
        sound: config.sound || 'default',
        timeout: config.timeout || 5
      };
      
    } catch (error) {
      throw new Error(`MacOS通知发送失败: ${error.message}`);
    }
  }
}

// STDIO MCP 协议处理
class StdioMCPTransport {
  constructor(server) {
    this.server = server;
    this.setupStdio();
  }

  setupStdio() {
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    process.stdin.on('data', (chunk) => {
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

  async handleMessage(message) {
    try {
      const request = JSON.parse(message);
      const response = await this.server.handleRequest(request);
      
      const jsonResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result: response
      };
      
      process.stdout.write(JSON.stringify(jsonResponse) + '\n');
    } catch (error) {
      const errorResponse = {
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
async function startServer() {
  console.error('🚀 Notice MCP Server 启动中...');
  
  // 加载配置
  const config = await loadConfig();
  
  const server = new SimpleMCPServer(config);
  const transport = new StdioMCPTransport(server);
  
  console.error('✅ Notice MCP Server 已启动，等待连接...');
  console.error('📋 可用工具: send_notification, get_backends');
  console.error('🔧 支持后端: email, webhook, slack, macos');
  
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