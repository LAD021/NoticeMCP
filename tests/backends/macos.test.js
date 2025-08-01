#!/usr/bin/env node

/**
 * MacOS通知后端测试脚本
 * 测试新添加的MacOS系统通知功能
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 测试MacOS通知功能
async function testMacOSNotification() {
  console.log('🧪 开始测试MacOS通知后端...');
  
  try {
    // 测试基本通知
    console.log('\n📱 测试1: 基本通知');
    await sendMacOSNotification('测试通知', '这是一个来自Notice MCP的测试通知');
    
    // 测试带副标题的通知
    console.log('\n📱 测试2: 带副标题的通知');
    await sendMacOSNotification(
      '重要提醒', 
      '您的任务已完成', 
      { subtitle: '来自AI助手' }
    );
    
    // 测试带声音的通知
    console.log('\n📱 测试3: 带声音的通知');
    await sendMacOSNotification(
      '声音测试', 
      '这个通知包含声音效果', 
      { sound: 'Glass' }
    );
    
    // 测试完整配置的通知
    console.log('\n📱 测试4: 完整配置通知');
    await sendMacOSNotification(
      '完整测试', 
      '这是一个包含所有配置选项的通知', 
      { 
        subtitle: '功能演示',
        sound: 'Hero'
      }
    );
    
    console.log('\n✅ 所有MacOS通知测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 发送MacOS通知的函数
async function sendMacOSNotification(title, message, config = {}) {
  try {
    // 转义字符串中的特殊字符
    const escapeString = (str) => {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'") 
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    };
    
    // 构建 osascript 命令
    let script = `display notification "${escapeString(message)}" with title "${escapeString(title)}"`;
    
    // 添加可选参数
    if (config.subtitle) {
      script += ` subtitle "${escapeString(config.subtitle)}"`;
    }
    
    if (config.sound) {
      script += ` sound name "${escapeString(config.sound)}"`;
    }
    
    // 执行 osascript 命令
    const command = `osascript -e '${script}'`;
    
    console.log(`   执行命令: ${command}`);
    
    await execAsync(command);
    
    console.log(`   ✅ 通知发送成功: "${title}"`);
    
    // 等待一秒，避免通知过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error(`   ❌ 通知发送失败: ${error.message}`);
    throw error;
  }
}

// 获取可用的系统声音列表
async function getAvailableSounds() {
  try {
    console.log('\n🔊 获取可用的系统声音...');
    const { stdout } = await execAsync('ls /System/Library/Sounds/*.aiff | xargs -I {} basename {} .aiff');
    const sounds = stdout.trim().split('\n').filter(sound => sound.length > 0);
    
    console.log('可用声音:', sounds.join(', '));
    return sounds;
  } catch (error) {
    console.warn('无法获取系统声音列表:', error.message);
    return ['default', 'Glass', 'Hero', 'Ping', 'Pop', 'Purr', 'Sosumi'];
  }
}

// 测试MCP服务器集成
async function testMCPIntegration() {
  console.log('\n🔗 测试MCP服务器集成...');
  
  // 模拟MCP请求
  const mcpRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'send_notification',
      arguments: {
        title: 'MCP集成测试',
        message: '通过MCP协议发送的MacOS通知',
        backend: 'macos',
        config: {
          subtitle: 'MCP测试',
          sound: 'Ping'
        }
      }
    }
  };
  
  console.log('MCP请求:', JSON.stringify(mcpRequest, null, 2));
  console.log('✅ MCP集成测试配置完成');
}

// 主函数
async function main() {
  console.log('🚀 MacOS通知后端测试开始');
  console.log('=' .repeat(50));
  
  // 获取可用声音
  await getAvailableSounds();
  
  // 测试通知功能
  await testMacOSNotification();
  
  // 测试MCP集成
  await testMCPIntegration();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 MacOS通知后端测试完成！');
  console.log('\n💡 提示:');
  console.log('- 确保您的Mac允许终端发送通知');
  console.log('- 在系统偏好设置 > 通知中检查通知权限');
  console.log('- 现在可以在Claude Desktop中使用MacOS通知后端了');
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { sendMacOSNotification, getAvailableSounds };