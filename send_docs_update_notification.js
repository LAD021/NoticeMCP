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

// 发送文档更新完成通知
const title = '📚 使用文档更新完成';
const message = `Notice MCP Server 文档已更新！\n\n✅ README.md - 添加稳定性说明\n✅ 故障排除部分 - 新增 ReferenceError 修复\n✅ TRAE_SETUP.md - 更新配置指南\n✅ 服务器验证步骤 - 完善启动检查\n\n文档现在包含最新的修复信息和配置指南。`;

sendMacOSNotification(title, message);