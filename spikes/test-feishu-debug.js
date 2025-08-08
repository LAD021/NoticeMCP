#!/usr/bin/env node

/**
 * 飞书发送调试测试脚本
 * 用于直接测试飞书发送功能，查看详细的错误信息
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取配置文件
function loadConfig() {
  try {
    const configPath = join(__dirname, '..', 'config.toml');
    const configContent = readFileSync(configPath, 'utf-8');
    
    // 简单解析TOML配置中的飞书部分
    const lines = configContent.split('\n');
    let inFeishuSection = false;
    const feishuConfig = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '[backends.feishu]') {
        inFeishuSection = true;
        continue;
      }
      if (trimmed.startsWith('[') && trimmed !== '[backends.feishu]') {
        inFeishuSection = false;
        continue;
      }
      if (inFeishuSection && trimmed.includes('=')) {
        const [key, value] = trimmed.split('=').map(s => s.trim());
        if (key === 'enabled') {
          feishuConfig.enabled = value === 'true';
        } else if (key === 'webhook_url') {
          feishuConfig.webhook_url = value.replace(/"/g, '');
        }
      }
    }
    
    return feishuConfig;
  } catch (error) {
    console.error('读取配置文件失败:', error.message);
    return null;
  }
}

// 飞书发送函数（从start.js复制）
async function sendFeishu(title, message, config = {}) {
  try {
    console.log(`[DEBUG] sendFeishu called with config:`, JSON.stringify(config, null, 2));
    const webhookUrl = config.webhook_url || config.webhookUrl;
    console.log(`[DEBUG] webhookUrl found:`, webhookUrl);
    if (!webhookUrl) {
      console.log(`[ERROR] 飞书配置无效，需要提供 webhook_url`);
      throw new Error('飞书配置无效，需要提供 webhook_url');
    }

    // 构建飞书消息格式
    let text = `**${title}**\n\n${message}`;
    
    // 添加 @ 功能
    if (config.atAll) {
      text += '\n\n<at user_id="all">所有人</at>';
    }
    
    if (config.atUsers && config.atUsers.length > 0) {
      config.atUsers.forEach(userId => {
        text += `\n<at user_id="${userId}">@${userId}</at>`;
      });
    }
    
    if (config.atMobiles && config.atMobiles.length > 0) {
      config.atMobiles.forEach(mobile => {
        text += `\n<at user_id="${mobile}">@${mobile}</at>`;
      });
    }

    const payload = {
      msg_type: 'text',
      content: {
        text: text
      }
    };

    // 如果有签名密钥，添加签名
    if (config.secret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const crypto = await import('crypto');
      const stringToSign = `${timestamp}\n${config.secret}`;
      const hmac = crypto.createHmac('sha256', stringToSign);
      const sign = hmac.digest('base64');
      
      payload.timestamp = timestamp.toString();
      payload.sign = sign;
      console.log(`[FEISHU] 添加签名: timestamp=${timestamp}, sign=${sign}`);
    }

    console.log(`[FEISHU] 发送到飞书群聊: ${webhookUrl}`);
    console.log(`[FEISHU] 标题: ${title}`);
    console.log(`[FEISHU] 内容: ${message}`);
    console.log(`[FEISHU] 请求载荷:`, JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'notice-mcp/1.0.0'
      },
      body: JSON.stringify(payload)
    });

    console.log(`[FEISHU] 响应状态: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[FEISHU] 错误响应: ${errorText}`);
      throw new Error(`飞书API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[FEISHU] 响应结果:`, JSON.stringify(result, null, 2));
    
    if (result.code !== 0) {
      console.log(`[FEISHU] 飞书返回错误代码: ${result.code}, 消息: ${result.msg}`);
      throw new Error(`飞书消息发送失败: ${result.msg || '未知错误'}`);
    }

    const returnValue = {
      messageId: `feishu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      webhookUrl: webhookUrl,
      hasSecret: !!config.secret,
      atAll: config.atAll,
      atUsersCount: config.atUsers?.length || 0,
      atMobilesCount: config.atMobiles?.length || 0,
      feishuResponse: result
    };
    
    console.log(`[FEISHU] 成功发送，返回值:`, JSON.stringify(returnValue, null, 2));
    return returnValue;
  } catch (error) {
    console.log(`[FEISHU] 发送失败:`, error.message);
    throw new Error(`飞书通知发送失败: ${error.message}`);
  }
}

// 主函数
async function main() {
  console.log('=== 飞书发送调试测试 ===');
  
  // 加载配置
  const config = loadConfig();
  if (!config) {
    console.error('无法加载配置文件');
    process.exit(1);
  }
  
  console.log('飞书配置:', JSON.stringify(config, null, 2));
  
  if (!config.enabled) {
    console.error('飞书后端未启用');
    process.exit(1);
  }
  
  try {
    const result = await sendFeishu(
      'NoticeMCP - 直接调试测试',
      `这是一个直接调用飞书发送功能的测试。\n\n发送时间: ${new Date().toLocaleString('zh-CN')}`,
      config
    );
    
    console.log('\n=== 测试成功 ===');
    console.log('返回结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

// 运行测试
main().catch(console.error);