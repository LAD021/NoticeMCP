#!/usr/bin/env node

/**
 * TOML配置管理测试脚本
 * 测试配置文件的加载、解析和使用
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置管理器
async function testConfigManager() {
  console.log('🧪 开始测试TOML配置管理...');
  
  try {
    // 导入配置管理器
    const { ConfigManager } = await import('./src/config/manager.js');
    
    console.log('✅ 配置管理器导入成功');
    
    // 创建配置管理器实例
    const configManager = new ConfigManager();
    console.log('✅ 配置管理器实例创建成功');
    
    // 加载配置
    await configManager.loadConfig();
    console.log('✅ 配置文件加载成功');
    
    // 获取配置摘要
    const summary = configManager.getConfigSummary();
    console.log('📋 配置摘要:', summary);
    
    // 测试各个后端配置
    const backends = ['email', 'webhook', 'slack', 'macos'];
    
    console.log('\n🔧 测试后端配置:');
    for (const backend of backends) {
      const config = configManager.getBackendConfig(backend);
      const enabled = configManager.isBackendEnabled(backend);
      console.log(`  ${backend}: ${enabled ? '✅ 启用' : '❌ 禁用'} - ${config ? '有配置' : '无配置'}`);
      
      if (config && enabled) {
        console.log(`    配置详情:`, JSON.stringify(config, null, 2).substring(0, 100) + '...');
      }
    }
    
    // 测试模板配置
    console.log('\n📝 测试模板配置:');
    const templates = configManager.getConfig().templates;
    for (const [name, template] of Object.entries(templates)) {
      console.log(`  ${name}: "${template.title}"`);
    }
    
    // 测试环境变量映射
    console.log('\n🌍 测试环境变量映射:');
    const testValue = configManager.getEnvOrConfig('backends.email.smtp.user', 'EMAIL_USER');
    console.log(`  EMAIL_USER 或 backends.email.smtp.user: ${testValue || '未设置'}`);
    
    // 验证配置
    const validation = configManager.validateConfig();
    console.log('\n✅ 配置验证:', validation.valid ? '通过' : '失败');
    if (!validation.valid) {
      console.log('❌ 验证错误:', validation.errors);
    }
    
    console.log('\n🎉 TOML配置管理测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error.stack);
    process.exit(1);
  }
}

// 测试配置与MCP服务器集成
async function testMCPIntegration() {
  console.log('\n🔗 测试MCP服务器集成...');
  
  try {
    // 导入MCP服务器
    const { SimpleMCPServer } = await import('./start.js');
    
    // 导入配置管理器
    const { ConfigManager } = await import('./src/config/manager.js');
    const configManager = new ConfigManager();
    await configManager.loadConfig();
    
    // 创建带配置的MCP服务器
    const server = new SimpleMCPServer(configManager);
    console.log('✅ MCP服务器创建成功，已集成配置管理器');
    
    // 测试通知发送（模拟）
    console.log('\n📤 测试通知发送（使用配置文件设置）:');
    
    const testNotifications = [
      {
        title: '测试邮件通知',
        message: '这是一个测试邮件通知',
        backend: 'email'
      },
      {
        title: '测试Webhook通知',
        message: '这是一个测试Webhook通知',
        backend: 'webhook'
      },
      {
        title: '测试Slack通知',
        message: '这是一个测试Slack通知',
        backend: 'slack'
      },
      {
        title: '测试MacOS通知',
        message: '这是一个测试MacOS通知',
        backend: 'macos'
      }
    ];
    
    for (const notification of testNotifications) {
      try {
        console.log(`  测试 ${notification.backend} 通知...`);
        const result = await server.sendNotification(notification);
        console.log(`    结果: ${result.success ? '✅ 成功' : '❌ 失败'} - ${result.message || result.error || '无消息'}`);
      } catch (error) {
        console.log(`    结果: ❌ 异常 - ${error.message}`);
      }
    }
    
    console.log('\n🎉 MCP服务器集成测试完成!');
    
  } catch (error) {
    console.error('❌ 集成测试失败:', error.message);
    console.error('详细错误:', error.stack);
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始TOML配置管理完整测试\n');
  
  await testConfigManager();
  await testMCPIntegration();
  
  console.log('\n✨ 所有测试完成!');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 测试运行失败:', error);
    process.exit(1);
  });
}

export { testConfigManager, testMCPIntegration };