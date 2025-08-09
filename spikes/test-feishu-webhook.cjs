#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 开始测试飞书 Webhook 功能...');

// 启动 MCP 服务器
const serverProcess = spawn('node', ['start.js'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'pipe'
});

let serverReady = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('服务器输出:', output.trim());
  
  if (output.includes('Notice MCP Server 已启动') || output.includes('等待连接')) {
    serverReady = true;
    console.log('✅ MCP 服务器已启动');
    
    // 等待一秒后开始测试
    setTimeout(testFeishuWebhook, 1000);
  }
});

serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error('服务器错误:', output);
  
  if (!serverReady && (output.includes('Notice MCP Server 已启动') || output.includes('等待连接'))) {
    serverReady = true;
    console.log('✅ MCP 服务器已启动');
    
    // 等待一秒后开始测试
    setTimeout(testFeishuWebhook, 1000);
  }
});

// 测试飞书 Webhook
function testFeishuWebhook() {
  console.log('\n📱 开始测试飞书通知发送...');
  
  const testMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'send_notification',
      arguments: {
        title: '飞书 Webhook 测试',
        message: `测试时间: ${new Date().toLocaleString()}\n\n这是一条来自 NoticeMCP 的测试消息，用于验证飞书 Webhook 配置是否正常工作。`,
        backend: 'feishu'
      }
    }
  };

  const messageData = JSON.stringify(testMessage) + '\n';
  
  // 通过 stdin 发送消息到 MCP 服务器
  serverProcess.stdin.write(messageData);
  
  // 监听服务器响应
  let responseReceived = false;
  const responseTimeout = setTimeout(() => {
    if (!responseReceived) {
      console.log('\n⏰ 等待响应超时');
      cleanup();
    }
  }, 10000);
  
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output && output.startsWith('{')) {
      try {
        const response = JSON.parse(output);
        if (response.id === 1) {
          responseReceived = true;
          clearTimeout(responseTimeout);
          
          console.log('\n📋 飞书测试结果:');
          console.log('响应:', JSON.stringify(response, null, 2));
          
          // 解析实际的响应内容
          let testSuccess = false;
          if (response.result && response.result.content && response.result.content[0]) {
            try {
              const resultText = response.result.content[0].text;
              const resultData = JSON.parse(resultText);
              testSuccess = resultData.success === true;
            } catch (parseError) {
              console.log('解析结果失败:', parseError.message);
            }
          }
          
          if (testSuccess) {
            console.log('\n✅ 飞书 Webhook 测试成功！');
            console.log('消息已发送到飞书群聊');
          } else {
            console.log('\n❌ 飞书 Webhook 测试失败');
            if (response.error) {
              console.log('错误信息:', response.error.message);
            }
          }
          
          // 清理并退出
          setTimeout(cleanup, 1000);
        }
      } catch (error) {
        console.error('\n❌ 解析响应失败:', error.message);
        console.log('原始响应:', output);
      }
    }
  });
}

// 清理函数
function cleanup() {
  console.log('\n🧹 清理资源...');
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
    console.log('✅ 服务器进程已终止');
  }
  
  setTimeout(() => {
    console.log('\n🎯 测试完成！');
    process.exit(0);
  }, 1000);
}

// 处理进程退出
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 超时保护
setTimeout(() => {
  console.log('\n⏰ 测试超时，强制退出');
  cleanup();
}, 30000);