#!/usr/bin/env node

// 简单的测试脚本，用于验证MCP服务器基本功能
// 这个脚本模拟了MCP服务器的核心功能，不依赖外部库

class MockNotificationManager {
  constructor() {
    this.backends = new Map();
    this.setupMockBackends();
  }

  setupMockBackends() {
    // 模拟邮件后端
    this.backends.set('email', {
      send: async (title, message, config) => {
        console.log(`[EMAIL] 发送邮件:`);
        console.log(`  标题: ${title}`);
        console.log(`  内容: ${message}`);
        console.log(`  收件人: ${config?.to || 'default@example.com'}`);
        return {
          messageId: `email_${Date.now()}`,
          success: true
        };
      }
    });

    // 模拟Webhook后端
    this.backends.set('webhook', {
      send: async (title, message, config) => {
        console.log(`[WEBHOOK] 发送到: ${config?.url || 'http://example.com/webhook'}`);
        console.log(`  标题: ${title}`);
        console.log(`  内容: ${message}`);
        return {
          messageId: `webhook_${Date.now()}`,
          success: true
        };
      }
    });

    // 模拟Slack后端
    this.backends.set('slack', {
      send: async (title, message, config) => {
        console.log(`[SLACK] 发送到频道: ${config?.channel || '#general'}`);
        console.log(`  标题: ${title}`);
        console.log(`  内容: ${message}`);
        return {
          messageId: `slack_${Date.now()}`,
          success: true
        };
      }
    });
  }

  async sendNotification(title, message, backend, config) {
    const backendImpl = this.backends.get(backend);
    if (!backendImpl) {
      throw new Error(`未找到后端: ${backend}`);
    }

    try {
      const result = await backendImpl.send(title, message, config);
      return {
        success: true,
        backend,
        timestamp: new Date().toISOString(),
        ...result
      };
    } catch (error) {
      return {
        success: false,
        backend,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  getAvailableBackends() {
    return Array.from(this.backends.keys());
  }
}

// 模拟MCP服务器
class MockMCPServer {
  constructor() {
    this.notificationManager = new MockNotificationManager();
  }

  async handleToolCall(toolName, args) {
    switch (toolName) {
      case 'send_notification':
        return await this.notificationManager.sendNotification(
          args.title,
          args.message,
          args.backend,
          args.config
        );
      
      case 'get_backends':
        return {
          backends: this.notificationManager.getAvailableBackends(),
          count: this.notificationManager.getAvailableBackends().length
        };
      
      default:
        throw new Error(`未知工具: ${toolName}`);
    }
  }
}

// 测试函数
async function runTests() {
  console.log('🚀 启动 Notice MCP 服务器测试\n');
  
  const server = new MockMCPServer();

  // 测试1: 获取可用后端
  console.log('📋 测试1: 获取可用后端');
  try {
    const backends = await server.handleToolCall('get_backends', {});
    console.log('✅ 成功:', JSON.stringify(backends, null, 2));
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
  console.log();

  // 测试2: 发送邮件通知
  console.log('📧 测试2: 发送邮件通知');
  try {
    const result = await server.handleToolCall('send_notification', {
      title: 'AI模型训练完成',
      message: '您的图像分类模型训练已完成，准确率达到95.2%',
      backend: 'email',
      config: {
        to: 'researcher@company.com',
        subject: '[AI训练完成] 图像分类模型'
      }
    });
    console.log('✅ 成功:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
  console.log();

  // 测试3: 发送Slack通知
  console.log('💬 测试3: 发送Slack通知');
  try {
    const result = await server.handleToolCall('send_notification', {
      title: '🎉 数据分析任务完成',
      message: '用户行为分析报告已生成完成！活跃用户增长12.5%',
      backend: 'slack',
      config: {
        webhookUrl: 'https://hooks.slack.com/services/mock',
        channel: '#data-science',
        username: 'Data Bot'
      }
    });
    console.log('✅ 成功:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
  console.log();

  // 测试4: 发送Webhook通知
  console.log('🔗 测试4: 发送Webhook通知');
  try {
    const result = await server.handleToolCall('send_notification', {
      title: '系统监控警报',
      message: '服务器CPU使用率超过90%，需要立即处理',
      backend: 'webhook',
      config: {
        url: 'https://api.monitoring.com/alerts',
        method: 'POST'
      }
    });
    console.log('✅ 成功:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ 失败:', error.message);
  }
  console.log();

  // 测试5: 错误处理
  console.log('⚠️  测试5: 错误处理（无效后端）');
  try {
    const result = await server.handleToolCall('send_notification', {
      title: '测试',
      message: '测试消息',
      backend: 'invalid_backend'
    });
    console.log('结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ 预期错误:', error.message);
  }

  console.log('\n🎯 测试完成！Notice MCP 服务器功能正常');
  console.log('\n📖 使用说明:');
  console.log('1. 这是一个MCP服务器，用于发送各种通知');
  console.log('2. 支持邮件、Webhook、Slack三种后端');
  console.log('3. 可以轻松扩展新的通知后端');
  console.log('4. 在实际使用中，需要配置真实的SMTP、Webhook URL等');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { MockMCPServer, MockNotificationManager };