#!/usr/bin/env node

// 直接测试MCP服务的sendNotification方法
import { SimpleMCPServer } from '../start.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 简单的配置管理器
class TestConfigManager {
  constructor() {
    // 直接硬编码配置
    this.config = {
      server: {
        debug: true
      },
      backends: {
        macos: {
          enabled: true,
          default_sound: 'Glass',
          default_subtitle: '来自 Notice MCP'
        },
        feishu: {
          enabled: true,
          webhook_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/fb198b0a-6794-48f5-a5d6-d1a746c8f0a4'
        }
      }
    };
  }
  
  getConfig() {
    return this.config;
  }
  
  getBackendConfig(backend) {
    return this.config.backends?.[backend];
  }
}

async function testMCPSendNotification() {
  try {
    console.log('=== MCP SendNotification 测试开始 ===');
    
    // 创建配置管理器和MCP服务器
    const configManager = new TestConfigManager();
    const mcpServer = new SimpleMCPServer(configManager);
    
    console.log('MCP服务器已创建');
    
    // 测试参数
    const args = {
      title: 'NoticeMCP - MCP调试测试',
      message: '直接测试MCP服务的sendNotification方法，查看每个后端的详细返回结果。'
    };
    
    console.log('发送参数:', JSON.stringify(args, null, 2));
    
    // 调用sendNotification方法
    console.log('\n=== 开始调用sendNotification ===');
    const result = await mcpServer.sendNotification(args);
    
    console.log('\n=== sendNotification 返回结果 ===');
    console.log(JSON.stringify(result, null, 2));
    
    // 解析返回的内容
    if (result.content && result.content[0] && result.content[0].text) {
      const parsedResult = JSON.parse(result.content[0].text);
      console.log('\n=== 解析后的结果 ===');
      console.log('成功:', parsedResult.success);
      console.log('消息:', parsedResult.message);
      console.log('结果数量:', parsedResult.results?.length || 0);
      console.log('错误数量:', parsedResult.errors?.length || 0);
      
      if (parsedResult.results) {
        console.log('\n=== 成功的后端 ===');
        parsedResult.results.forEach((r, i) => {
          console.log(`${i + 1}. ${r.backend}: ${JSON.stringify(r, null, 2)}`);
        });
      }
      
      if (parsedResult.errors) {
        console.log('\n=== 失败的后端 ===');
        parsedResult.errors.forEach((e, i) => {
          console.log(`${i + 1}. ${e.backend}: ${e.error}`);
        });
      }
    }
    
    console.log('\n✅ MCP测试完成');
    
  } catch (error) {
    console.error('❌ MCP测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testMCPSendNotification();