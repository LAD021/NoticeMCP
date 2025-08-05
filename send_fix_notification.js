#!/usr/bin/env node

import { execSync } from 'child_process';

function sendMacOSNotification(title, message) {
  try {
    const escapedTitle = title.replace(/'/g, "'\\''");
    const escapedMessage = message.replace(/'/g, "'\\''");
    
    const command = `osascript -e 'display notification "${escapedMessage}" with title "${escapedTitle}" sound name "Glass"'`;
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ MacOS 通知发送成功: "${title}"`);
    return true;
  } catch (error) {
    console.error('❌ 发送通知失败:', error.message);
    return false;
  }
}

// 发送修复完成通知
const title = '🔧 MCP 服务器修复完成';
const message = `ReferenceError 已修复！\n✅ 变量作用域问题已解决\n✅ 服务器重新启动成功\n✅ MCP 连接现在应该正常工作\n\n可以在 Trae AI 中重新连接测试。`;

sendMacOSNotification(title, message);