/**
 * Notice MCP Server 配置管理器
 * 支持TOML配置文件的加载、解析和管理
 */

// ES模块导入
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简单的TOML解析器
 * 支持基本的TOML语法解析
 */
class SimpleTomlParser {
  static parse(content) {
    const result = {};
    const lines = content.split('\n');
    let currentSection = result;
    let currentSectionPath = [];
    let i = 0;

    while (i < lines.length) {
      let line = lines[i].trim();
      
      // 跳过空行和注释
      if (!line || line.startsWith('#')) {
        i++;
        continue;
      }
      
      // 处理节（section）
      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionName = line.slice(1, -1);
        const sectionParts = sectionName.split('.');
        
        currentSection = result;
        currentSectionPath = [];
        
        for (const part of sectionParts) {
          if (!currentSection[part]) {
            currentSection[part] = {};
          }
          currentSection = currentSection[part];
          currentSectionPath.push(part);
        }
        i++;
        continue;
      }
      
      // 处理键值对
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        let valueStr = line.substring(equalIndex + 1).trim();
        
        // 处理多行数组
        if (valueStr.startsWith('[') && !valueStr.endsWith(']')) {
          // 多行数组开始
          let arrayLines = [valueStr];
          i++;
          while (i < lines.length) {
            const nextLine = lines[i].trim();
            arrayLines.push(nextLine);
            if (nextLine.endsWith(']')) {
              break;
            }
            i++;
          }
          valueStr = arrayLines.join(' ');
        }
        
        const value = this.parseValue(valueStr);
        currentSection[key] = value;
      }
      i++;
    }
    
    return result;
  }

  static parseValue(valueStr) {
    valueStr = valueStr.trim();
    
    // 移除行内注释
    const commentIndex = valueStr.indexOf('#');
    if (commentIndex !== -1) {
      valueStr = valueStr.substring(0, commentIndex).trim();
    }
    
    // 布尔值
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;
    
    // 数字
    if (/^-?\d+$/.test(valueStr)) {
      return parseInt(valueStr, 10);
    }
    if (/^-?\d+\.\d+$/.test(valueStr)) {
      return parseFloat(valueStr);
    }
    
    // 字符串（去掉引号）
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) ||
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
      return valueStr.slice(1, -1);
    }
    
    // 数组
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      const arrayContent = valueStr.slice(1, -1).trim();
      if (!arrayContent) return [];
      return arrayContent.split(',').map(item => this.parseValue(item.trim()));
    }
    
    // 默认作为字符串处理
    return valueStr;
  }
}

/**
 * 配置管理器类
 * 负责加载、解析和管理TOML配置文件
 */
class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath || path.join(process.cwd(), 'config.toml');
    this.config = this.getDefaultConfig();
  }

  /**
   * 异步加载配置文件
   */
  async loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const userConfig = SimpleTomlParser.parse(content);
        this.config = this.mergeConfig(this.getDefaultConfig(), userConfig);
        console.error(`📋 配置文件已从 ${this.configPath} 加载`);
      } else {
        console.error(`⚠️  配置文件 ${this.configPath} 不存在，使用默认配置`);
      }
    } catch (error) {
      console.error(`❌ 配置文件加载失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      server: {
        name: "Notice MCP Server",
        version: "1.0.0",
        port: 3000,
        debug: false
      },
      logging: {
        level: "info",
        file: "notice.log",
        enable_console: true
      },
      backends: {
        email: {
          enabled: false,
          default_from: "noreply@example.com",
          default_subject: "通知",
          smtp: {
            host: "smtp.example.com",
            port: 587,
            secure: false
          },
          recipients: {
            default: [],
            admin: [],
            dev: []
          }
        },
        webhook: {
          enabled: false,
          default_method: "POST",
          timeout: 5000,
          retry_count: 3,
          retry_delay: 1000,
          endpoints: {},
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Notice-MCP-Server/1.0"
          }
        },
        slack: {
          enabled: false,
          default_channel: "#general",
          default_username: "Notice Bot",
          default_icon_emoji: ":bell:",
          default_icon_url: "",
          workspaces: {}
        },
        macos: {
          enabled: true,
          default_sound: "default",
          default_subtitle: "",
          show_in_notification_center: true,
          sounds: {
            available: [
              "Basso", "Blow", "Bottle", "Frog", "Funk", "Glass", "Hero",
              "Morse", "Ping", "Pop", "Purr", "Sosumi", "Submarine", "Tink"
            ]
          }
        },
        feishu: {
          enabled: false,
          webhook: [],
          secret: "",
          atAll: false,
          atUserIds: []
        }
      },
      templates: {
        default: {
          title: "通知",
          message: "您有新的通知消息"
        },
        alert: {
          title: "⚠️ 警告",
          message: "系统检测到异常情况",
          sound: "Basso"
        },
        info: {
          title: "ℹ️ 信息",
          message: "系统信息通知",
          sound: "Glass"
        },
        success: {
          title: "✅ 成功",
          message: "操作已成功完成",
          sound: "Hero"
        },
        error: {
          title: "❌ 错误",
          message: "系统发生错误",
          sound: "Sosumi"
        }
      },
      security: {
        allowed_ips: ["127.0.0.1", "::1"],
        require_https: false
      },
      rate_limiting: {
        enabled: false,
        max_requests_per_minute: 60,
        max_requests_per_hour: 1000,
        max_requests_per_day: 10000,
        backends: {
          email: 10,
          webhook: 100,
          slack: 50,
          macos: 200
        }
      },
      environment: {
        EMAIL_USER: "backends.email.smtp.user",
        EMAIL_PASS: "backends.email.smtp.pass",
        SLACK_TOKEN: "backends.slack.workspaces.default",
        WEBHOOK_URL: "backends.webhook.endpoints.default"
      },
      features: {
        enable_history: false,
        history_max_entries: 1000,
        history_retention_days: 30,
        enable_statistics: false,
        statistics_retention_days: 90,
        enable_queue: false,
        queue_max_size: 100,
        queue_retry_attempts: 3,
        enable_deduplication: false,
        deduplication_window_minutes: 5
      },
      development: {
        debug_mode: false,
        simulation_mode: false,
        verbose_logging: false,
        test_mode: false
      },
      testing: {
        test_email: "test@example.com",
        test_slack_channel: "#test",
        test_webhook_url: "http://localhost:3001/webhook"
      },
      performance: {
        max_concurrent_notifications: 10,
        connection_timeout: 5000,
        request_timeout: 10000,
        connection_pool_size: 5
      }
    };
  }

  /**
   * 深度合并配置对象
   */
  mergeConfig(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    // 处理后端配置的特殊情况：将平级的后端配置映射到backends下
    const knownBackends = ['macos', 'feishu', 'email', 'webhook', 'slack'];
    
    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        if (knownBackends.includes(key)) {
          // 将后端配置放到backends下
          if (!result.backends) {
            result.backends = {};
          }
          result.backends[key] = { ...result.backends[key], ...userConfig[key] };
        } else if (typeof userConfig[key] === 'object' && userConfig[key] !== null && !Array.isArray(userConfig[key])) {
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
  getConfig() {
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
  getBackendConfig(backend) {
    return this.config.backends[backend];
  }

  /**
   * 获取模板配置
   */
  getTemplate(templateName) {
    return this.config.templates[templateName];
  }

  /**
   * 检查后端是否启用
   */
  isBackendEnabled(backend) {
    const backendConfig = this.getBackendConfig(backend);
    // 如果没有配置或没有enabled字段，默认为false
    return backendConfig && backendConfig.enabled === true;
  }

  /**
   * 获取环境变量或配置值
   */
  getEnvOrConfig(configPath, envKey) {
    // 首先尝试从环境变量获取
    if (envKey && process.env[envKey]) {
      return process.env[envKey];
    }
    
    // 然后从配置文件获取
    const pathParts = configPath.split('.');
    let value = this.config;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && value.hasOwnProperty(part)) {
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
  async reload() {
    await this.loadConfig();
  }

  /**
   * 验证配置
   */
  validateConfig() {
    const errors = [];
    
    // 验证后端配置
    for (const [backendName, backendConfig] of Object.entries(this.config.backends)) {
      if (this.isBackendEnabled(backendName)) {
        switch (backendName) {
          case 'feishu':
            if (backendConfig.webhook && Array.isArray(backendConfig.webhook)) {
              for (const url of backendConfig.webhook) {
                if (!url.startsWith('https://open.feishu.cn/')) {
                  errors.push(`飞书webhook URL必须以 https://open.feishu.cn/ 开头: ${url}`);
                }
              }
            } else {
              errors.push('飞书后端启用时，必须配置有效的webhook URL数组');
            }
            break;
          case 'macos':
            // macOS后端无需特殊验证
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
   * 获取配置摘要
   */
  getConfigSummary() {
    const enabledBackends = Object.keys(this.config.backends || {})
      .filter(backend => this.isBackendEnabled(backend));
    return `激活后端: ${enabledBackends.join(', ')}`;
  }
}

export { ConfigManager, SimpleTomlParser };