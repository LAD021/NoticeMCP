#!/usr/bin/env node

/**
 * Notice MCP Server 启动脚本
 * 这个脚本提供了一个简化版本的MCP服务器，可以在没有完整依赖的情况下运行
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log } from './src/utils/logger.js';

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
    return configManager;
  } catch (error) {
    return null;
  }
}

// 简化的MCP协议处理
class SimpleMCPServer {
  constructor(configManager = null) {
    this.configManager = configManager;
    this.startTime = new Date().toISOString(); // 记录服务器启动时间
    
    // 根据配置动态确定可用后端
    const availableBackends = this.getAvailableBackends();
    
    // 基础工具
    this.tools = [
      {
        name: 'send_notification',
        description: '发送通知消息到所有启用的后端',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '通知标题' },
            message: { type: 'string', description: '通知内容' },
            config: { type: 'object', description: '后端特定配置（可选）' }
          },
          required: ['title', 'message']
        }
      }
    ];
    
    // 在调试模式下添加调试工具
    const debugMode = this.isDebugMode();
    console.error(`[DEBUG] Debug mode: ${debugMode}`);
    if (debugMode) {
      console.error('[DEBUG] Adding get_server_info tool');
      this.tools.push({
        name: 'get_server_info',
        description: '获取服务器启动信息（仅调试模式）',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      });
    }
    console.error(`[DEBUG] Total tools: ${this.tools.length}`);
    console.error(`[DEBUG] Tool names: ${this.tools.map(t => t.name).join(', ')}`);
  }
  
  // 检测是否为调试模式
  isDebugMode() {
    // 检查环境变量或配置文件中的调试设置
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      return true;
    }
    
    // 检查配置文件中的调试设置
    if (this.configManager) {
      const config = this.configManager.getConfig();
      return config.server?.debug === true;
    }
    
    return false;
  }
  
  getAvailableBackends() {
    console.error(`[DEBUG] getAvailableBackends called, configManager:`, !!this.configManager);
    if (!this.configManager) {
      console.error(`[DEBUG] No configManager, returning default backends`);
      return ['macos', 'feishu'];
    }
    
    const backends = [];
    const config = this.configManager.getConfig();
    console.error(`[DEBUG] Full config:`, JSON.stringify(config, null, 2));
    
    if (config.backends) {
      console.error(`[DEBUG] Backends config:`, JSON.stringify(config.backends, null, 2));
      if (config.backends.email && config.backends.email.enabled) {
        backends.push('email');
      }
      if (config.backends.webhook && config.backends.webhook.enabled) {
        backends.push('webhook');
      }
      if (config.backends.slack && config.backends.slack.enabled) {
        backends.push('slack');
      }
      if (config.backends.macos && config.backends.macos.enabled) {
        console.error(`[DEBUG] macOS backend enabled`);
        backends.push('macos');
      }
      if (config.backends.feishu && config.backends.feishu.enabled) {
        console.error(`[DEBUG] Feishu backend enabled`);
        backends.push('feishu');
      }
    }
    
    console.error(`[DEBUG] Final backends list:`, backends);
    return backends.length > 0 ? backends : ['macos', 'feishu'];
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
      
      case 'get_server_info':
        return await this.getServerInfo(args);

      default:
        throw new Error(`未知工具: ${name}`);
    }
  }
  
  async getServerInfo(args) {
    const uptime = Date.now() - new Date(this.startTime).getTime();
    const uptimeSeconds = Math.floor(uptime / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    
    const formatUptime = () => {
      if (uptimeHours > 0) {
        return `${uptimeHours}小时${uptimeMinutes % 60}分钟${uptimeSeconds % 60}秒`;
      } else if (uptimeMinutes > 0) {
        return `${uptimeMinutes}分钟${uptimeSeconds % 60}秒`;
      } else {
        return `${uptimeSeconds}秒`;
      }
    };
    
    const serverInfo = {
      startTime: this.startTime,
      uptime: formatUptime(),
      uptimeMs: uptime,
      debugMode: this.isDebugMode(),
      availableBackends: this.getAvailableBackends(),
      nodeEnv: process.env.NODE_ENV || 'unknown',
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: '服务器信息获取成功',
          data: serverInfo
        }, null, 2)
      }]
    };
  }

  async sendNotification(args) {
    log.mcp.info('SendNotification method called', {
      args,
      configManagerExists: !!this.configManager,
      pid: process.pid
    });
    const { title, message, config = {} } = args;
    
    const results = [];
    const errors = [];
    
    // 获取所有启用的后端
    const availableBackends = this.getAvailableBackends();
    log.mcp.debug('Available backends', { backends: availableBackends });
    
    // 使用Promise.allSettled确保所有后端都被处理
    const backendPromises = availableBackends.map(async (backend) => {
      try {
        log.mcp.debug('Processing backend', { backend });
        // 合并配置文件中的配置
        let finalConfig = { ...config };
        if (this.configManager) {
          const backendConfig = this.configManager.getBackendConfig(backend);
          log.mcp.debug('Backend config', { backend, config: backendConfig });
          if (backendConfig) {
            finalConfig = { ...backendConfig, ...config };
          }
        }
        log.mcp.debug('Final config', { backend, config: finalConfig });
        
        let result;
        
        log.mcp.info('Processing backend', { backend: backend.toUpperCase() });
        
        switch (backend) {
          case 'email':
            log.mcp.debug('Calling sendEmail', { backend });
            result = await this.sendEmail(title, message, finalConfig);
            break;
          case 'webhook':
            log.mcp.debug('Calling sendWebhook', { backend });
            result = await this.sendWebhook(title, message, finalConfig);
            break;
          case 'slack':
            log.mcp.debug('Calling sendSlack', { backend });
            result = await this.sendSlack(title, message, finalConfig);
            break;
          case 'macos':
            log.mcp.debug('Calling sendMacOS', { backend });
            result = await this.sendMacOS(title, message, finalConfig);
            break;
          case 'feishu':
            log.mcp.debug('Calling sendFeishu', { backend });
            result = await this.sendFeishu(title, message, finalConfig);
            log.mcp.debug('sendFeishu returned', { backend, result });
            break;
          default:
            throw new Error(`不支持的后端: ${backend}`);
        }

        log.mcp.info('Backend result', { backend: backend.toUpperCase(), result });
        
        const backendResult = {
          backend,
          success: true,
          ...result
        };
        
        log.mcp.debug('Adding backend to results', { backend, result: backendResult });
        return { type: 'success', result: backendResult };
        
      } catch (error) {
        log.mcp.error('Backend failed', { backend, error: error.message, stack: error.stack });
        const errorResult = {
          backend,
          success: false,
          error: error.message
        };
        log.mcp.debug('Adding backend to errors', { backend, result: errorResult });
        return { type: 'error', result: errorResult };
      }
    });
    
    // 等待所有后端处理完成
    log.mcp.debug('Waiting for backends to complete', { count: availableBackends.length });
    const settledResults = await Promise.allSettled(backendPromises);
    
    // 处理结果
    settledResults.forEach((settled, index) => {
      const backend = availableBackends[index];
      if (settled.status === 'fulfilled') {
        const { type, result } = settled.value;
        if (type === 'success') {
          results.push(result);
        } else {
          errors.push(result);
        }
      } else {
        log.mcp.error('Promise rejected for backend', { backend, reason: settled.reason });
        errors.push({
          backend,
          success: false,
          error: settled.reason?.message || 'Promise rejected'
        });
      }
    });
    
    const hasSuccess = results.length > 0;
    const hasErrors = errors.length > 0;
    
    const response = {
      success: hasSuccess,
      message: hasSuccess ? 
        (hasErrors ? `部分通知发送成功 (${results.length}/${results.length + errors.length})` : '所有通知发送成功') :
        '所有通知发送失败',
      timestamp: new Date().toISOString(),
      results,
      errors: errors.length > 0 ? errors : undefined
    };

    log.mcp.info('Final response summary', {
      totalBackends: availableBackends.length,
      successfulResults: results.length,
      failedResults: errors.length,
      results,
      errors,
      response
    });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response, null, 2)
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
      console.error('[DEBUG] sendMacOS config:', JSON.stringify(config, null, 2));
      console.error('DEBUG: config.timeout:', config.timeout, 'type:', typeof config.timeout);
      
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
      
      console.error('[DEBUG] notificationOptions.timeout:', notificationOptions.timeout, 'type:', typeof notificationOptions.timeout);
      console.error('[DEBUG] config.timeout:', config.timeout);
      
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
      
      console.error(`[MacOS通知] 发送通知:`, notificationOptions);
      
      // 使用 Promise 包装 node-notifier 的回调
      await new Promise((resolve, reject) => {
        notifier.notify(notificationOptions, (err, response) => {
          if (err) {
            reject(err);
          } else {
            console.error(`[MacOS通知] 通知响应:`, response);
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
      log.debug('Starting Feishu send', { title, message, config });
      
      const webhookUrl = config.webhook_url || config.webhookUrl;
      log.debug('Extracted webhook URL', { webhookUrl });
      if (!webhookUrl) {
        log.error('Invalid Feishu config: webhook_url required');
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
        const hmac = crypto.createHmac('sha256', config.secret);
        hmac.update(stringToSign);
        const sign = hmac.digest('base64');
        
        payload.timestamp = timestamp.toString();
        payload.sign = sign;
        console.error(`[FEISHU] 添加签名: timestamp=${timestamp}, sign=${sign}`);
      }

      log.info('Sending to Feishu', { webhookUrl, title, message, payload });

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'notice-mcp/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      log.debug('Feishu response status', { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        const errorText = await response.text();
        log.error('Feishu API error response', { status: response.status, statusText: response.statusText, errorText });
        throw new Error(`飞书API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      log.debug('Feishu response result', { result });
      
      if (result.code !== 0) {
        log.error('Feishu returned error code', { code: result.code, message: result.msg });
        throw new Error(`飞书消息发送失败: ${result.msg || '未知错误'}`);
      }

      const returnValue = {
        messageId: `feishu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhookUrl: webhookUrl,
        hasSecret: !!config.secret,
        atAll: config.atAll,
        atUsersCount: config.atUsers?.length || 0,
        atMobilesCount: config.atMobiles?.length || 0,
        feishuResponse: result
      };
      
      log.info('Feishu send success', { returnValue });
       
       return returnValue;
     } catch (error) {
       log.error('Feishu send failed', { error: error.message, stack: error.stack });
      
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
  
  console.error('[DEBUG] Creating SimpleMCPServer instance...');
  const server = new SimpleMCPServer(configManager);
  console.error(`[DEBUG] Server created with ${server.tools.length} tools`);
  const transport = new StdioMCPTransport(server);
  
  console.error('✅ Notice MCP Server 已启动，等待连接...');
  console.error(`📋 可用工具: ${server.tools.map(t => t.name).join(', ')}`);
  
  if (server.isDebugMode()) {
    console.error('🐛 调试模式已启用');
  }
  
  const availableBackends = server.getAvailableBackends();
  console.error(`🔧 支持后端: ${availableBackends.join(', ')}`);
  
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
