/**
 * 配置加载器
 */

import { ConfigManager } from './manager.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 加载配置文件
 */
export async function loadConfig(): Promise<ConfigManager | null> {
  try {
    const configPath = join(__dirname, '../../config.toml');
    const configManager = ConfigManager.getInstance(configPath);
    
    console.error('🚀 Notice MCP Server 启动中...');
    
    const config = configManager.getConfig();
    const enabledBackends = ['feishu', 'macos'].filter(backend => 
      configManager.isBackendEnabled(backend)
    );
    
    console.error(`📋 配置文件已加载: 服务器: ${config.server.name} v${config.server.version}, 启用后端: ${enabledBackends.join(', ')}, 调试模式: ${config.server.debug ? '开启' : '关闭'}`);
    
    return configManager;
  } catch (error: any) {
    console.error('⚠️  配置文件加载失败，使用默认配置:', error.message);
    return null;
  }
}