#!/usr/bin/env node

// 测试新的日志系统
import { log } from '../src/utils/logger.js';
import { SimpleMCPServer } from '../start.js';
import { ConfigManager } from '../src/config/manager.js';

async function testLogger() {
  console.log('=== 测试日志系统 ===');
  
  // 测试基本日志功能
  log.debug('这是一个调试消息', { test: 'debug' });
  log.info('这是一个信息消息', { test: 'info' });
  log.warn('这是一个警告消息', { test: 'warn' });
  log.error('这是一个错误消息', { test: 'error' });
  
  // 测试MCP专用日志
  log.mcp.debug('MCP调试消息', { method: 'test' });
  log.mcp.info('MCP信息消息', { status: 'running' });
  log.mcp.request('send_notification', { title: 'test', message: 'test' });
  log.mcp.response({ success: true });
  log.mcp.notification('feishu', 'success', { messageId: 'test123' });
  
  console.log('\n=== 测试MCP服务器日志 ===');
  
  try {
    // 创建配置管理器
    const configManager = new ConfigManager();
    await configManager.loadConfig();
    
    // 创建MCP服务器实例
    const server = new SimpleMCPServer(configManager);
    
    console.log('MCP服务器已创建，开始发送测试通知...');
    
    // 发送测试通知
    const result = await server.sendNotification({
      title: '日志系统测试',
      message: '这是一个测试新日志系统的通知消息'
    });
    
    console.log('\n=== 通知发送完成 ===');
    console.log('结果:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    log.error('Test failed', { error: error.message, stack: error.stack });
  }
  
  console.log('\n=== 日志测试完成 ===');
  console.log('请检查 logs/ 目录下的日志文件');
}

testLogger();