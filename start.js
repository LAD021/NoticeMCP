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
      


      default:
        throw new Error(`未知工具: ${name}`);
    }
  }

  async sendNotification(args) {
    // 明确忽略backend参数，只提取需要的参数
    const { title, message } = args;
    
    console.log('📤 发送通知到所有启用的后端');
    console.log('🔍 Debug - sendNotification args:', JSON.stringify(args, null, 2));
    console.log('🔍 Debug - 提取的参数 - title:', title, 'message:', message);
    
    // 始终发送到所有启用的后端
    return await this.sendToAllEnabledBackends(title, message);
  }

  async sendToAllEnabledBackends(title, message) {
    const availableBackends = ['email', 'webhook', 'slack', 'macos'];
    const enabledBackends = [];
    
    // 检查哪些后端是启用的
    for (const backendName of availableBackends) {
      if (this.configManager && this.configManager.isBackendEnabled(backendName)) {
        enabledBackends.push(backendName);
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
    
    const results = [];
    
    // 并行发送到所有启用的后端
    const promises = enabledBackends.map(async (backendName) => {
      try {
        // 使用配置文件中的配置
        let finalConfig = {};
        if (this.configManager) {
          const backendConfig = this.configManager.getBackendConfig(backendName);
          if (backendConfig) {
            finalConfig = { ...backendConfig };
          }
        }
        
        let result;
        switch (backendName) {
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
        }
        
        return {
          success: true,
          backend: backendName,
          timestamp: new Date().toISOString(),
          ...result
        };
      } catch (error) {
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
      console.log('[DEBUG] sendMacOS config:', JSON.stringify(config, null, 2));
      console.log('DEBUG: config.timeout:', config.timeout, 'type:', typeof config.timeout);
      
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
        timeout: config.timeout !== undefined ? config.timeout : false // false 表示常驻通知
      };
      
      console.log('[DEBUG] notificationOptions.timeout:', notificationOptions.timeout, 'type:', typeof notificationOptions.timeout);
      console.log('[DEBUG] config.timeout:', config.timeout);
      
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
        timeout: config.timeout !== undefined ? config.timeout : false
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
    let request = null;
    try {
      request = JSON.parse(message);
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
  console.error('📋 可用工具:', server.tools.map(t => t.name).join(', '));
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