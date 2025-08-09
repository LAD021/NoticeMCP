#!/usr/bin/env node

// 简单的飞书测试脚本
async function testFeishu() {
  try {
    console.log('=== 飞书测试开始 ===');
    
    // 直接使用飞书配置（从之前的日志中获取）
    const feishuConfig = {
      enabled: true,
      webhook_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/fb198b0a-6794-48f5-a5d6-d1a746c8f0a4'
    };
    
    console.log('飞书配置:', JSON.stringify(feishuConfig, null, 2));
    
    if (!feishuConfig || !feishuConfig.enabled) {
      throw new Error('飞书后端未启用');
    }
    
    if (!feishuConfig.webhook_url) {
      throw new Error('飞书webhook_url未配置');
    }
    
    // 构建消息
    const title = 'NoticeMCP - 飞书测试';
    const message = '这是一个独立的飞书测试，验证飞书API是否正常工作。';
    
    const payload = {
      msg_type: 'text',
      content: {
        text: `**${title}**\n\n${message}`
      }
    };
    
    console.log('发送载荷:', JSON.stringify(payload, null, 2));
    console.log('目标URL:', feishuConfig.webhook_url);
    
    // 发送请求
    const response = await fetch(feishuConfig.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'notice-mcp-test/1.0.0'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('错误响应:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('响应结果:', JSON.stringify(result, null, 2));
    
    if (result.code !== 0) {
      throw new Error(`飞书API错误: ${result.msg || '未知错误'}`);
    }
    
    console.log('✅ 飞书测试成功!');
    return {
      success: true,
      messageId: `feishu_test_${Date.now()}`,
      response: result
    };
    
  } catch (error) {
    console.error('❌ 飞书测试失败:', error.message);
    console.error('错误详情:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
testFeishu().then(result => {
  console.log('=== 测试结果 ===');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});