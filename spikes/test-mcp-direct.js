#!/usr/bin/env node

// 直接测试MCP服务的sendNotification方法
import { SimpleMCPServer } from '../start.js';
import { ConfigManager } from '../src/config/manager.js';

async function testMCPDirect() {
  console.log('=== 直接测试MCP服务 ===');
  
  try {
    // 创建配置管理器
    const configManager = new ConfigManager();
    await configManager.loadConfig();
    
    // 创建MCP服务器实例
    const server = new SimpleMCPServer(configManager);
    
    console.log('MCP服务器已创建');
    console.log('可用后端:', server.getAvailableBackends());
    
    // 直接调用sendNotification方法
    console.log('\n开始调用sendNotification...');
    const result = await server.sendNotification({
      title: '直接测试通知',
      message: '这是一个直接调用MCP服务sendNotification方法的测试'
    });
    
    console.log('\n=== 调用结果 ===');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

testMCPDirect();