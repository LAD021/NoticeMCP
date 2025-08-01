#!/usr/bin/env node

/**
 * 测试通过 MCP 服务器发送 MacOS 通知
 */

import { SimpleMCPServer } from '../../start.js';
import { ConfigManager } from '../../src/config/manager.js';

async function testMCPMacOSNotification() {
  console.log('🧪 开始测试通过 MCP 服务器发送 MacOS 通知...');
  
  try {
    // 加载配置
    const configManager = new ConfigManager();
    await configManager.loadConfig();
    console.log('📋 配置已加载:', configManager.getConfigSummary());
    
    // 创建 MCP 服务器实例
    const server = new SimpleMCPServer(configManager);
    
    // 测试基本 MacOS 通知
    console.log('\n1. 测试基本 MacOS 通知...');
    try {
      const result1 = await server.sendNotification({
        backend: 'macos',
        title: 'MCP 测试通知',
        message: '这是通过 MCP 服务器发送的基本通知'
      });
      console.log('✅ 基本通知发送成功:', result1);
    } catch (error) {
      console.error('❌ 基本通知发送失败:', error.message);
    }
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试带配置的 MacOS 通知
    console.log('\n2. 测试带配置的 MacOS 通知...');
    try {
      const result2 = await server.sendNotification({
        backend: 'macos',
        title: 'MCP 高级通知',
        message: '这是通过 MCP 服务器发送的高级通知',
        config: {
          subtitle: 'MCP 副标题',
          sound: 'Ping',
          timeout: 8
        }
      });
      console.log('✅ 高级通知发送成功:', result2);
    } catch (error) {
      console.error('❌ 高级通知发送失败:', error.message);
    }
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试使用配置文件中的 MacOS 配置
    console.log('\n3. 测试使用配置文件中的 MacOS 配置...');
    try {
      const result3 = await server.sendNotification({
        backend: 'macos',
        title: 'MCP 配置文件通知',
        message: '这个通知使用了配置文件中的 MacOS 设置'
      });
      console.log('✅ 配置文件通知发送成功:', result3);
    } catch (error) {
      console.error('❌ 配置文件通知发送失败:', error.message);
    }
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试模拟 MCP 工具调用
    console.log('\n4. 测试模拟 MCP 工具调用...');
    try {
      const toolCallResult = await server.handleToolCall({
        name: 'send_notification',
        arguments: {
          backend: 'macos',
          title: 'MCP 工具调用通知',
          message: '这是通过 MCP 工具调用发送的通知',
          config: {
            subtitle: '工具调用',
            sound: 'Glass',
            timeout: 6
          }
        }
      });
      console.log('✅ MCP 工具调用成功:', toolCallResult);
    } catch (error) {
      console.error('❌ MCP 工具调用失败:', error.message);
    }
    
    console.log('\n🎉 MCP MacOS 通知测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPMacOSNotification().catch(console.error);
}

export { testMCPMacOSNotification };