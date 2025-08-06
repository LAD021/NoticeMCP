#!/usr/bin/env node

import { SimpleMCPServer } from './start.js';
import { ConfigManager } from './src/config/manager.js';

async function testMacOSNotification() {
  try {
    console.log('🧪 直接测试MacOS通知...');
    
    // 加载配置
    const configManager = new ConfigManager();
    await configManager.loadConfig();
    
    // 创建服务器实例
    const server = new SimpleMCPServer(configManager);
    
    // 测试MacOS通知
    const result = await server.sendNotification({
      backend: 'macos',
      title: '🔧 直接测试通知',
      message: '这是直接测试MacOS通知功能，检查timeout返回值是否正确。'
    });
    
    console.log('✅ 通知发送结果:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testMacOSNotification();