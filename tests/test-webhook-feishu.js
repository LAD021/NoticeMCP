#!/usr/bin/env node

/**
 * Webhook和飞书后端测试脚本
 * 测试简化后的配置和功能
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试数据
const tests = [
  {
    name: 'Webhook默认配置测试',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'send_notification',
        arguments: {
          title: 'Webhook测试',
          message: '这是一个使用默认配置的webhook测试通知',
          backend: 'webhook'
        }
      }
    }
  },
  {
    name: 'Webhook自定义配置测试',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'send_notification',
        arguments: {
          title: 'Webhook自定义测试',
          message: '这是一个使用自定义URL的webhook测试通知',
          backend: 'webhook',
          config: {
            url: 'https://httpbin.org/post',
            method: 'POST',
            timeout: 3000
          }
        }
      }
    }
  },
  {
    name: '飞书默认配置测试',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'send_notification',
        arguments: {
          title: '飞书测试',
          message: '这是一个使用默认配置的飞书测试通知',
          backend: 'feishu'
        }
      }
    }
  },
  {
    name: '飞书自定义配置测试',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'send_notification',
        arguments: {
          title: '飞书自定义测试',
          message: '这是一个使用自定义配置的飞书测试通知',
          backend: 'feishu',
          config: {
            webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/TEST_TOKEN',
            secret: 'test-secret'
          }
        }
      }
    }
  },
  {
    name: '获取后端列表测试',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_backends',
        arguments: {}
      }
    }
  }
];

async function runTest(test) {
  console.log(`\n🧪 运行测试: ${test.name}`);
  console.log('📤 发送请求:', JSON.stringify(test.request, null, 2));
  
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '../dist/index.js');
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      console.log('📥 服务器输出:', errorOutput);
      
      try {
        const lines = output.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine) {
          const response = JSON.parse(lastLine);
          console.log('📥 响应结果:', JSON.stringify(response, null, 2));
          
          if (response.error) {
            console.log('❌ 测试失败:', response.error.message);
          } else {
            console.log('✅ 测试成功');
          }
        }
      } catch (error) {
        console.log('❌ 解析响应失败:', error.message);
        console.log('原始输出:', output);
      }
      
      resolve();
    });
    
    child.on('error', (error) => {
      console.log('❌ 进程错误:', error.message);
      reject(error);
    });
    
    // 发送初始化请求
    const initRequest = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {}
    };
    
    child.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // 等待一下再发送测试请求
    setTimeout(() => {
      child.stdin.write(JSON.stringify(test.request) + '\n');
      child.stdin.end();
    }, 100);
  });
}

async function runAllTests() {
  console.log('🚀 开始运行Webhook和飞书后端测试...');
  console.log('📋 测试项目:');
  tests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name}`);
  });
  
  for (const test of tests) {
    try {
      await runTest(test);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    } catch (error) {
      console.error(`❌ 测试 "${test.name}" 失败:`, error.message);
    }
  }
  
  console.log('\n🎉 所有测试完成！');
  console.log('\n📝 注意事项:');
  console.log('  - Webhook测试使用了httpbin.org作为测试端点');
  console.log('  - 飞书测试使用了默认的占位符URL，实际发送会失败');
  console.log('  - 要测试真实的飞书通知，请在config.toml中配置真实的webhook_url');
}

// 运行测试
runAllTests().catch(console.error);