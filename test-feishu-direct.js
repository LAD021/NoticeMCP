#!/usr/bin/env node

// 直接测试飞书后端功能
// 使用 Node.js 内置的 fetch API

async function testFeishu() {
  console.log('🚀 开始测试飞书后端...');
  
  const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/fb198b0a-6794-48f5-a5d6-d1a746c8f0a4';
  const title = 'NoticeMCP - 直接测试';
  const message = '这是一个直接测试飞书后端的消息';
  
  try {
    const text = `**${title}**\n\n${message}`;
    
    const payload = {
      msg_type: 'text',
      content: {
        text: text
      }
    };
    
    console.log('📤 发送到飞书:', webhookUrl);
    console.log('📋 载荷:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'notice-mcp/1.0.0'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📊 响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 请求失败:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('📋 响应结果:', JSON.stringify(result, null, 2));
    
    if (result.code !== 0) {
      console.error('❌ 飞书返回错误:', result.msg || '未知错误');
    } else {
      console.log('✅ 飞书消息发送成功!');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('📋 错误详情:', error);
  }
}

testFeishu();