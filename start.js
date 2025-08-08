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
    
    // 根据配置动态确定可用后端
    const availableBackends = this.getAvailableBackends();
    
    this.tools = [
      {
        name: 'send_notification',
        description: '发送通知消息到指定后端',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '通知标题' },
            message: { type: 'string', description: '通知内容' },
            backend: { type: 'string', enum: availableBackends, description: '通知后端类型' },
            config: { type: 'object', description: '后端特定配置' }
          },
          required: ['title', 'message', 'backend']
        }
      }
    ];
  }
  
  getAvailableBackends() {
    if (!this.configManager) {
      return ['macos']; // 默认只支持 macOS
    }
    
    const backends = [];
    const config = this.configManager.getConfig();
    
    if (config.backends) {
      if (config.backends.email && config.backends.email.enabled) backends.push('email');
      if (config.backends.webhook && config.backends.webhook.enabled) backends.push('webhook');
      if (config.backends.slack && config.backends.slack.enabled) backends.push('slack');
      if (config.backends.macos && config.backends.macos.enabled) backends.push('macos');
      if (config.backends.feishu && config.backends.feishu.enabled) backends.push('feishu');
    }
    
    return backends.length > 0 ? backends : ['macos'];
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
        case 'feishu':
          result = await this.sendFeishu(title, message, finalConfig);
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

  async sendFeishu(title, message, config = {}) {
    try {
      const webhookUrl = config.webhook_url || config.webhookUrl;
      if (!webhookUrl) {
        throw new Error('飞书配置无效，需要提供 webhook_url');
      }

      // 构建飞书消息格式
      let text = `**${title}**\n\n${message}`;
      
      // 添加 @ 功能
      if (config.atAll) {
        text += '\n\n<at user_id="all">所有人</at>';
      }
      
      if (config.atUsers && config.atUsers.length > 0) {
        config.atUsers.forEach(userId => {
          text += `\n<at user_id="${userId}">@${userId}</at>`;
        });
      }
      
      if (config.atMobiles && config.atMobiles.length > 0) {
        config.atMobiles.forEach(mobile => {
          text += `\n<at user_id="${mobile}">@${mobile}</at>`;
        });
      }

      const payload = {
        msg_type: 'text',
        content: {
          text: text
        }
      };

      // 如果有签名密钥，添加签名
      if (config.secret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const crypto = await import('crypto');
        const stringToSign = `${timestamp}\n${config.secret}`;
        const hmac = crypto.createHmac('sha256', stringToSign);
        const sign = hmac.digest('base64');
        
        payload.timestamp = timestamp.toString();
        payload.sign = sign;
      }

      console.log(`[FEISHU] 发送到飞书群聊: ${webhookUrl}`);
      console.log(`[FEISHU] 标题: ${title}`);
      console.log(`[FEISHU] 内容: ${message}`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'notice-mcp/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`飞书API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(`飞书消息发送失败: ${result.msg || '未知错误'}`);
      }

      return {
        messageId: `feishu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookUrl: webhookUrl,
        hasSecret: !!config.secret,
        atAll: config.atAll,
        atUsersCount: config.atUsers?.length || 0,
        atMobilesCount: config.atMobiles?.length || 0
      };
    } catch (error) {
      throw new Error(`飞书通知发送失败: ${error.message}`);
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
  console.log('📋 可用工具: send_notification');
  
  const availableBackends = server.getAvailableBackends();
  console.log(`🔧 支持后端: ${availableBackends.join(', ')}`);
  
  if (config) {
    console.log('⚙️  使用TOML配置文件');
  } else {
    console.log('⚙️  使用默认配置');
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { SimpleMCPServer, StdioMCPTransport };