#!/usr/bin/env node

/**
 * Trae AI MCP 集成测试脚本
 * 用于验证 Trae AI 是否正确配置了 Notice MCP Server
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

function checkTraeConfig() {
  console.log('🔍 检查 Trae AI MCP 配置...');
  
  // 确定配置文件路径
  let configPath;
  if (process.platform === 'darwin') {
    configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Trae', 'trae_config.json');
  } else if (process.platform === 'win32') {
    configPath = path.join(process.env.APPDATA, 'Trae', 'trae_config.json');
  } else {
    console.log('❌ 不支持的操作系统');
    return false;
  }
  
  console.log(`📁 配置文件路径: ${configPath}`);
  
  // 检查配置文件是否存在
  if (!fs.existsSync(configPath)) {
    console.log('❌ Trae 配置文件不存在');
    console.log('💡 请按照以下步骤配置:');
    console.log('   1. 创建配置目录（如果不存在）');
    if (process.platform === 'darwin') {
      console.log('      mkdir -p "~/Library/Application Support/Trae"');
    } else {
      console.log('      mkdir "%APPDATA%\\Trae"');
    }
    console.log('   2. 复制配置文件');
    if (process.platform === 'darwin') {
      console.log('      cp trae_config.json "~/Library/Application Support/Trae/"');
    } else {
      console.log('      copy trae_config.json "%APPDATA%\\Trae\\"');
    }
    console.log('   3. 重启 Trae AI');
    return false;
  }
  
  try {
    // 读取并解析配置文件
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    console.log('✅ 配置文件存在');
    
    // 检查 MCP 服务器配置
    if (!config.mcpServers) {
      console.log('❌ 配置文件中没有 mcpServers 配置');
      return false;
    }
    
    if (!config.mcpServers['notice-mcp']) {
      console.log('❌ 配置文件中没有 notice-mcp 服务器配置');
      return false;
    }
    
    const noticeMcpConfig = config.mcpServers['notice-mcp'];
    console.log('✅ 找到 notice-mcp 配置');
    
    // 检查命令和参数
    if (noticeMcpConfig.command !== 'node') {
      console.log('⚠️  命令不是 node，可能需要调整');
    }
    
    if (!noticeMcpConfig.args || !noticeMcpConfig.args[0]) {
      console.log('❌ 缺少启动脚本路径');
      return false;
    }
    
    const scriptPath = noticeMcpConfig.args[0];
    console.log(`📄 启动脚本: ${scriptPath}`);
    
    // 检查启动脚本是否存在
    if (!fs.existsSync(scriptPath)) {
      console.log('❌ 启动脚本不存在');
      console.log(`💡 请确保路径正确: ${scriptPath}`);
      return false;
    }
    
    console.log('✅ 启动脚本存在');
    
    // 检查环境变量
    if (noticeMcpConfig.env) {
      console.log('✅ 环境变量配置:');
      Object.entries(noticeMcpConfig.env).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    console.log('\n🎉 Trae AI MCP 配置检查完成！');
    console.log('💡 下一步:');
    console.log('   1. 确保 Notice MCP Server 正在运行');
    console.log('   2. 重启 Trae AI');
    console.log('   3. 在 Trae AI 中测试发送通知');
    
    return true;
    
  } catch (error) {
    console.log('❌ 配置文件解析失败:', error.message);
    return false;
  }
}

function showUsageExamples() {
  console.log('\n📝 Trae AI 中的使用示例:');
  console.log('\n1. 基本 MacOS 通知:');
  console.log('   "发送一个MacOS通知，标题\'任务完成\'，内容\'代码编译成功\'"');
  
  console.log('\n2. 带声音的通知:');
  console.log('   "发送通知，标题\'警告\'，内容\'内存使用率过高\'，声音\'Basso\'"');
  
  console.log('\n3. 邮件通知:');
  console.log('   "发送邮件通知给admin@company.com，主题\'系统警告\'，内容\'服务器负载过高\'"');
  
  console.log('\n4. Slack通知:');
  console.log('   "发送Slack消息到#general频道：\'部署完成\'"');
  
  console.log('\n5. 获取可用后端:');
  console.log('   "请列出所有可用的通知后端"');
}

function main() {
  console.log('🚀 Trae AI MCP 集成测试');
  console.log('=' .repeat(50));
  
  const configOk = checkTraeConfig();
  
  if (configOk) {
    showUsageExamples();
  }
  
  console.log('\n📚 更多信息请参考:');
  console.log('   - TRAE_SETUP.md - 详细配置指南');
  console.log('   - AI_ASSISTANT_GUIDE.md - AI 助手使用指南');
}

// 检查是否为主模块
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkTraeConfig, showUsageExamples };