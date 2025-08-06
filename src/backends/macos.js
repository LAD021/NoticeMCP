// Mac系统通知后端实现
import { fileURLToPath } from 'url';
import path from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 动态导入node-notifier模块
let notifier;
try {
  const { default: nodeNotifier } = await import('node-notifier');
  notifier = nodeNotifier;
} catch {
  notifier = null;
}

export class MacOSBackend {
  getDescription() {
    return 'Mac系统通知后端 - 使用node-notifier发送桌面通知';
  }

  getRequiredConfig() {
    return []; // 无必需配置
  }

  validateConfig(config) {
    if (!config) return true;
    
    // 验证可选配置
    if (config.sound && typeof config.sound !== 'string') {
      throw new Error('sound 必须是字符串类型');
    }
    
    if (config.subtitle && typeof config.subtitle !== 'string') {
      throw new Error('subtitle 必须是字符串类型');
    }
    
    if (config.timeout !== undefined && typeof config.timeout !== 'number' && config.timeout !== false) {
      throw new Error('timeout 必须是数字类型或false');
    }
    
    if (config.appIcon && typeof config.appIcon !== 'string') {
      throw new Error('appIcon 必须是字符串类型');
    }
    
    return true;
  }

  async send(title, message, config = {}) {
    try {
      if (!notifier) {
        throw new Error('node-notifier not available - please install node-notifier package');
      }
      
      // 构建 node-notifier 选项
      const notificationOptions = {
        title: title,
        message: message,
        sound: config.sound || true, // true 表示使用默认声音
        wait: config.wait || false,
        timeout: config.timeout !== undefined ? config.timeout : false // false 表示常驻通知
      };
      
      // 添加可选参数
      if (config.subtitle) {
        notificationOptions.subtitle = config.subtitle;
      }
      
      if (config.appIcon) {
        notificationOptions.appIcon = config.appIcon;
      }
      
      if (config.contentImage) {
        notificationOptions.contentImage = config.contentImage;
      }
      
      if (config.open) {
        notificationOptions.open = config.open;
      }
      
      console.log(`[MacOS通知] 发送通知:`, notificationOptions);
      
      // 使用 Promise 包装 node-notifier 的回调
      await new Promise((resolve, reject) => {
        notifier.notify(notificationOptions, (err, response) => {
          if (err) {
            reject(err);
          } else {
            console.log(`[MacOS通知] 通知响应:`, response);
            resolve();
          }
        });
      });
      
      return {
        success: true,
        backend: 'macos',
        messageId: `macos-${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {
          title,
          message,
          subtitle: config.subtitle,
          sound: config.sound || 'default',
          timeout: config.timeout !== undefined ? config.timeout : false
        }
      };
      
    } catch (error) {
      console.error('[MacOS通知] 发送失败:', error);
      
      return {
        success: false,
        backend: 'macos',
        messageId: `macos-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * 获取可用的系统声音列表
   */
  static getAvailableSounds() {
    // node-notifier 支持的 macOS 系统声音
    return [
      'Bottle', 'Blow', 'Frog', 'Funk', 'Glass', 'Hero', 
      'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'
    ];
  }

  /**
   * 创建富文本通知配置
   */
  static createRichNotification(options) {
    return {
      title: options.title,
      message: options.message,
      config: {
        subtitle: options.subtitle,
        sound: options.sound || 'Ping',
        timeout: options.timeout || 5,
        appIcon: options.appIcon,
        contentImage: options.contentImage,
        open: options.open
      }
    };
  }

  /**
   * 创建等待用户交互的通知
   */
  static createInteractiveNotification(options) {
    return {
      title: options.title,
      message: options.message,
      config: {
        subtitle: options.subtitle,
        sound: options.sound || 'Ping',
        wait: true,
        open: options.open
      }
    };
  }
}

export default MacOSBackend;