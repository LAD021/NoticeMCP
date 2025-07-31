/**
 * 配置管理器
 * 负责读取和解析TOML配置文件，提供配置访问接口
 */

// Type declarations for Node.js globals
declare const process: any;
declare const require: any;

// Dynamic imports for Node.js modules
const fs = require('fs');
const path = require('path');

/**
 * 简单的TOML解析器
 * 支持基本的TOML语法解析
 */
class SimpleTomlParser {
  static parse(content: string): any {
    const result: any = {};
    const lines = content.split('\n');
    let currentSection: any = result;
    let currentPath: string[] = [];
    
    for (let line of lines) {
      line = line.trim();
      
      // 跳过空行和注释
      if (!line || line.startsWith('#')) {
        continue;
      }
      
      // 处理节（section）
      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionName = line.slice(1, -1);
        const parts = sectionName.split('.');
        
        currentPath = parts;
        currentSection = result;
        
        // 创建嵌套对象
        for (const part of parts) {
          if (!currentSection[part]) {
            currentSection[part] = {};
          }
          currentSection = currentSection[part];
        }
        continue;
      }
      
      // 处理键值对
      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }
      
      const key = line.slice(0, equalIndex).trim();
      const valueStr = line.slice(equalIndex + 1).trim();
      
      currentSection[key] = this.parseValue(valueStr);
    }
    
    return result;
  }
  
  private static parseValue(valueStr: string): any {
    // 移除首尾空格
    valueStr = valueStr.trim();
    
    // 字符串值（带引号）
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
      return valueStr.slice(1, -1);
    }
    
    // 数组值
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      const arrayContent = valueStr.slice(1, -1).trim();
      if (!arrayContent) {
        return [];
      }
      
      return arrayContent.split(',').map(item => {
        const trimmed = item.trim();
        return this.parseValue(trimmed);
      });
    }
    
    // 布尔值
    if (valueStr === 'true') {
      return true;
    }
    if (valueStr === 'false') {
      return false;
    }
    
    // 数字值
    if (/^-?\d+$/.test(valueStr)) {
      return parseInt(valueStr, 10);
    }
    if (/^-?\d+\.\d+$/.test(valueStr)) {
      return parseFloat(valueStr);
    }
    
    // 默认作为字符串处理
    return valueStr;
  }
}

/**
 * 配置接口定义
 */
export interface NoticeConfig {
  server: {
    name: string;
    version: string;
    port: number;
    debug: boolean;
  };
  
  logging: {
    level: string;
    file: string;
    enable_console: boolean;
  };
  
  backends: {
    email: {
      enabled: boolean;
      default_from: string;
      default_subject: string;
      smtp: {
        host: string;
        port: number;
        secure: boolean;
        user?: string;
        pass?: string;
      };
      recipients: {
        default: string[];
        admin: string[];
        dev: string[];
      };
    };
    
    webhook: {
      enabled: boolean;
      default_method: string;
      timeout: number;
      retry_count: number;
      retry_delay: number;
      endpoints: Record<string, string>;
      headers: Record<string, string>;
    };
    
    slack: {
      enabled: boolean;
      default_channel: string;
      default_username: string;
      default_icon_emoji: string;
      default_icon_url: string;
      workspaces: Record<string, string>;
    };
    
    macos: {
      enabled: boolean;
      default_sound: string;
      default_subtitle: string;
      show_in_notification_center: boolean;
      sounds: {
        available: string[];
      };
    };
  };
  
  templates: Record<string, {
    title: string;
    message: string;
    subtitle?: string;
    sound?: string;
  }>;
  
  security: {
    allowed_ips: string[];
    api_key?: string;
    require_https: boolean;
  };
  
  rate_limiting: {
    enabled: boolean;
    max_requests_per_minute: number;
    max_requests_per_hour: number;
    max_requests_per_day: number;
    backends: Record<string, number>;
  };
  
  environment: Record<string, string>;
  
  features: {
    enable_history: boolean;
    history_max_entries: number;
    history_retention_days: number;
    enable_statistics: boolean;
    statistics_retention_days: number;
    enable_queue: boolean;
    queue_max_size: number;
    queue_retry_attempts: number;
    enable_deduplication: boolean;
    deduplication_window_minutes: number;
  };
  
  development: {
    debug_mode: boolean;
    simulation_mode: boolean;
    verbose_logging: boolean;
    test_mode: boolean;
  };
  
  testing: {
    test_email: string;
    test_slack_channel: string;
    test_webhook_url: string;
  };
  
  performance: {
    max_concurrent_notifications: number;
    connection_timeout: number;
    request_timeout: number;
    connection_pool_size: number;
  };
}

/**
 * 配置管理器类
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: NoticeConfig;
  private configPath: string;
  
  private constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config.toml');
    this.config = this.loadConfig();
  }
  
  /**
   * 获取配置管理器单例
   */
  static getInstance(configPath?: string): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager(configPath);
    }
    return ConfigManager.instance;
  }
  
  /**
   * 加载配置文件
   */
  private loadConfig(): NoticeConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`配置文件不存在: ${this.configPath}，使用默认配置`);
        return this.getDefaultConfig();
      }
      
      const content = fs.readFileSync(this.configPath, 'utf8');
      const parsedConfig = SimpleTomlParser.parse(content);
      
      // 合并默认配置和用户配置
      const defaultConfig = this.getDefaultConfig();
      return this.mergeConfig(defaultConfig, parsedConfig);
      
    } catch (error) {
      console.error(`加载配置文件失败: ${error}`);
      console.warn('使用默认配置');
      return this.getDefaultConfig();
    }
  }
  
  /**
   * 获取默认配置
   */
  private getDefaultConfig(): NoticeConfig {
    return {
      server: {
        name: 'Notice MCP Server',
        version: '1.0.0',
        port: 3000,
        debug: false
      },
      logging: {
        level: 'info',
        file: 'logs/notice-mcp.log',
        enable_console: true
      },
      backends: {
        email: {
          enabled: true,
          default_from: 'noreply@yourapp.com',
          default_subject: '通知来自 Notice MCP',
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false
          },
          recipients: {
            default: ['user@example.com'],
            admin: ['admin@example.com'],
            dev: ['dev@example.com']
          }
        },
        webhook: {
          enabled: true,
          default_method: 'POST',
          timeout: 5000,
          retry_count: 3,
          retry_delay: 1000,
          endpoints: {},
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Notice-MCP/1.0'
          }
        },
        slack: {
          enabled: true,
          default_channel: '#general',
          default_username: 'Notice Bot',
          default_icon_emoji: ':robot_face:',
          default_icon_url: '',
          workspaces: {}
        },
        macos: {
          enabled: true,
          default_sound: 'Glass',
          default_subtitle: '来自 Notice MCP',
          show_in_notification_center: true,
          sounds: {
            available: [
              'Basso', 'Blow', 'Bottle', 'Frog', 'Funk',
              'Glass', 'Hero', 'Morse', 'Ping', 'Pop',
              'Purr', 'Sosumi', 'Submarine', 'Tink'
            ]
          }
        }
      },
      templates: {
        task_completed: {
          title: '任务完成',
          message: '您的 {task_name} 已成功完成',
          subtitle: 'AI 助手',
          sound: 'Hero'
        },
        error: {
          title: '任务失败',
          message: '任务 {task_name} 执行失败：{error_message}',
          subtitle: '错误通知',
          sound: 'Basso'
        }
      },
      security: {
        allowed_ips: [],
        require_https: false
      },
      rate_limiting: {
        enabled: true,
        max_requests_per_minute: 60,
        max_requests_per_hour: 1000,
        max_requests_per_day: 10000,
        backends: {
          email: 10,
          webhook: 30,
          slack: 20,
          macos: 60
        }
      },
      environment: {},
      features: {
        enable_history: true,
        history_max_entries: 1000,
        history_retention_days: 30,
        enable_statistics: true,
        statistics_retention_days: 90,
        enable_queue: true,
        queue_max_size: 100,
        queue_retry_attempts: 3,
        enable_deduplication: true,
        deduplication_window_minutes: 5
      },
      development: {
        debug_mode: false,
        simulation_mode: false,
        verbose_logging: false,
        test_mode: false
      },
      testing: {
        test_email: 'test@example.com',
        test_slack_channel: '#testing',
        test_webhook_url: 'https://httpbin.org/post'
      },
      performance: {
        max_concurrent_notifications: 10,
        connection_timeout: 5000,
        request_timeout: 10000,
        connection_pool_size: 20
      }
    };
  }
  
  /**
   * 深度合并配置对象
   */
  private mergeConfig(defaultConfig: any, userConfig: any): any {
    const result = { ...defaultConfig };
    
    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        if (typeof userConfig[key] === 'object' && userConfig[key] !== null && !Array.isArray(userConfig[key])) {
          result[key] = this.mergeConfig(result[key] || {}, userConfig[key]);
        } else {
          result[key] = userConfig[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * 获取完整配置
   */
  getConfig(): NoticeConfig {
    return this.config;
  }
  
  /**
   * 获取服务器配置
   */
  getServerConfig() {
    return this.config.server;
  }
  
  /**
   * 获取后端配置
   */
  getBackendConfig(backend: string) {
    return (this.config.backends as any)[backend];
  }
  
  /**
   * 获取模板配置
   */
  getTemplate(templateName: string) {
    return this.config.templates[templateName];
  }
  
  /**
   * 检查后端是否启用
   */
  isBackendEnabled(backend: string): boolean {
    const backendConfig = this.getBackendConfig(backend);
    return backendConfig && backendConfig.enabled === true;
  }
  
  /**
   * 获取环境变量值或配置值
   */
  getEnvOrConfig(configPath: string, envKey?: string): any {
    // 如果指定了环境变量键，优先使用环境变量
    if (envKey && process.env[envKey]) {
      return process.env[envKey];
    }
    
    // 从配置中获取对应的环境变量键
    const envVarKey = this.config.environment[configPath];
    if (envVarKey && process.env[envVarKey]) {
      return process.env[envVarKey];
    }
    
    // 从配置路径获取值
    const pathParts = configPath.split('.');
    let value: any = this.config;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * 重新加载配置
   */
  reload(): void {
    this.config = this.loadConfig();
  }
  
  /**
   * 验证配置
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 验证必需的配置项
    if (!this.config.server.name) {
      errors.push('服务器名称不能为空');
    }
    
    if (!this.config.server.port || this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push('服务器端口必须在1-65535之间');
    }
    
    // 验证启用的后端配置
    for (const [backendName, backendConfig] of Object.entries(this.config.backends)) {
      if ((backendConfig as any).enabled) {
        switch (backendName) {
          case 'email':
            if (!(backendConfig as any).smtp.host) {
              errors.push('邮件后端启用时必须配置SMTP主机');
            }
            break;
          case 'slack':
            if (!Object.keys((backendConfig as any).workspaces).length) {
              errors.push('Slack后端启用时必须配置至少一个工作区');
            }
            break;
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 获取配置摘要（用于日志）
   */
  getConfigSummary(): string {
    const enabledBackends = Object.entries(this.config.backends)
      .filter(([_, config]) => (config as any).enabled)
      .map(([name, _]) => name);
    
    return `服务器: ${this.config.server.name} v${this.config.server.version}, ` +
           `启用后端: ${enabledBackends.join(', ')}, ` +
           `调试模式: ${this.config.development.debug_mode ? '开启' : '关闭'}`;
  }
}

// 导出配置管理器实例
export const configManager = ConfigManager.getInstance();