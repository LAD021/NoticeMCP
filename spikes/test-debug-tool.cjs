#!/usr/bin/env node

// 测试调试工具功能
const { readFileSync } = require('fs');
const { join } = require('path');

// __dirname is available in CommonJS

// 简单的配置检查
function checkDebugMode() {
  try {
    const configPath = join(__dirname, '..', 'config.toml');
    const configContent = readFileSync(configPath, 'utf8');
    console.log('✅ 配置文件读取成功');
    
    // 简单检查debug配置
    const debugMatch = configContent.match(/debug\s*=\s*(true|false)/);
    if (debugMatch) {
      return debugMatch[1] === 'true';
    }
    return false;
  } catch (error) {
    console.error('❌ 配置文件读取失败:', error.message);
    return false;
  }
}

function testDebugTool() {
  console.log('🧪 测试调试工具功能...');
  
  // 检查调试模式
  const isDebugMode = checkDebugMode();
  console.log(`🐛 调试模式: ${isDebugMode}`);
  
  // 模拟工具列表
  const baseTools = ['send_notification'];
  const debugTools = isDebugMode ? ['get_server_info'] : [];
  const allTools = [...baseTools, ...debugTools];
  
  console.log(`🔧 可用工具数量: ${allTools.length}`);
  console.log('📋 工具列表:');
  allTools.forEach((tool, index) => {
    console.log(`  ${index + 1}. ${tool}`);
  });
  
  if (isDebugMode) {
    console.log('\n✅ 调试模式已启用，get_server_info工具应该可用');
    console.log('💡 在MCP客户端中，你应该能够看到并调用get_server_info工具');
  } else {
    console.log('\n❌ 调试模式未启用，get_server_info工具不可用');
    console.log('💡 请在config.toml中设置debug = true来启用调试工具');
  }
}

// 运行测试
testDebugTool();