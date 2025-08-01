#!/usr/bin/env node

/**
 * 测试 node-notifier MacOS 通知功能
 */

import { MacOSBackend } from '../../src/backends/macos.js';

async function testNodeNotifier() {
  console.log('🧪 开始测试 node-notifier MacOS 通知功能...');
  
  const backend = new MacOSBackend();
  
  console.log('📝 后端描述:', backend.getDescription());
  console.log('🔧 必需配置:', backend.getRequiredConfig());
  console.log('🔊 可用声音:', MacOSBackend.getAvailableSounds());
  
  // 测试基本通知
  console.log('\n1. 测试基本通知...');
  try {
    const result1 = await backend.send('测试通知', '这是一个基本的测试通知');
    console.log('✅ 基本通知发送成功:', result1);
  } catch (error) {
    console.error('❌ 基本通知发送失败:', error.message);
  }
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试带副标题和声音的通知
  console.log('\n2. 测试带副标题和声音的通知...');
  try {
    const result2 = await backend.send('高级通知', '这是一个带副标题和声音的通知', {
      subtitle: '副标题内容',
      sound: 'Ping',
      timeout: 10
    });
    console.log('✅ 高级通知发送成功:', result2);
  } catch (error) {
    console.error('❌ 高级通知发送失败:', error.message);
  }
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试富文本通知
  console.log('\n3. 测试富文本通知...');
  try {
    const richNotification = MacOSBackend.createRichNotification({
      title: '富文本通知',
      message: '这是一个富文本通知，包含更多选项',
      subtitle: '富文本副标题',
      sound: 'Glass',
      timeout: 8
    });
    
    const result3 = await backend.send(
      richNotification.title, 
      richNotification.message, 
      richNotification.config
    );
    console.log('✅ 富文本通知发送成功:', result3);
  } catch (error) {
    console.error('❌ 富文本通知发送失败:', error.message);
  }
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试交互式通知
  console.log('\n4. 测试交互式通知...');
  try {
    const interactiveNotification = MacOSBackend.createInteractiveNotification({
      title: '交互式通知',
      message: '这是一个等待用户交互的通知',
      subtitle: '请点击查看',
      sound: 'Hero'
    });
    
    const result4 = await backend.send(
      interactiveNotification.title, 
      interactiveNotification.message, 
      interactiveNotification.config
    );
    console.log('✅ 交互式通知发送成功:', result4);
  } catch (error) {
    console.error('❌ 交互式通知发送失败:', error.message);
  }
  
  console.log('\n🎉 node-notifier 测试完成!');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testNodeNotifier().catch(console.error);
}

export { testNodeNotifier };