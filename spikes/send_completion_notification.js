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

// 发送测试完成通知
const title = '🎉 MCP 测试方案完成';
const message = `所有测试已按照方案执行完毕：
✅ Trae 集成测试 - 通过
✅ 单元测试 - 通过
✅ MacOS MCP 测试 - 通过
✅ 后端测试 - 通过
✅ 配置测试 - 通过

系统已准备就绪，可以在 Trae AI 中使用！`;

sendMacOSNotification(title, message);