#!/usr/bin/env node

/**
 * 测试MCP服务器状态和连接
 */

import { SimpleMCPServer } from '../start.js';
import { ConfigManager } from '../src/config/manager.js';

async function testMCPStatus() {
  console.log('=== MCP服务器状态测试 ===');
  
  try {
    // 创建配置管理器
    console.log('1. 加载配置管理器...');
    const configManager = new ConfigManager();
    await configManager.loadConfig();
    console.log('✅ 配置管理器加载成功');
    
    // 创建MCP服务器实例
    console.log('\n2. 创建MCP服务器实例...');
    const server = new SimpleMCPServer(configManager);
    console.log('✅ MCP服务器实例创建成功');
    
    // 检查工具列表
    console.log('\n3. 检查可用工具...');
    console.log('工具数量:', server.tools.length);
    console.log('工具列表:', server.tools.map(t => t.name));
    
    // 检查后端
    console.log('\n4. 检查可用后端...');
    const backends = server.getAvailableBackends();
    console.log('可用后端:', backends);
    
    // 检查调试模式
    console.log('\n5. 检查调试模式...');
    const debugMode = server.isDebugMode();
    console.log('调试模式:', debugMode);
    
    // 测试MCP请求处理
    console.log('\n6. 测试MCP请求处理...');
    const toolsListRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };
    
    const response = await server.handleRequest(toolsListRequest);
    console.log('tools/list 响应:', JSON.stringify(response, null, 2));
    
    // 测试发送通知
    console.log('\n7. 测试发送通知...');
    const notificationRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'send_notification',
        arguments: {
          title: 'MCP状态测试',
          message: '这是一个MCP服务器状态测试通知'
        }
      }
    };
    
    const notificationResponse = await server.handleRequest(notificationRequest);
    console.log('send_notification 响应:', JSON.stringify(notificationResponse, null, 2));
    
    console.log('\n=== 测试完成 ===');
    console.log('✅ MCP服务器功能正常');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

testMCPStatus();