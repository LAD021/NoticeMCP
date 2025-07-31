// Mac系统通知后端实现
import { NotificationBackend, NotificationResult } from '../notification/types';

// Node.js类型声明
declare const require: (id: string) => any;

// 动态导入node-notifier模块
const notifier = (() => {
  try {
    return require('node-notifier');
  } catch {
    return null;
  }
})();

export interface MacOSConfig {
  sound?: string; // 通知声音，如 'Bottle', 'Blow', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink' 等
  subtitle?: string; // 副标题
  timeout?: number; // 超时时间（秒）
  appIcon?: string; // 应用图标路径
  contentImage?: string; // 内容图片路径
  open?: string; // 点击通知时打开的URL或应用
  wait?: boolean; // 是否等待用户交互
}

export class MacOSBackend implements NotificationBackend {
  getDescription(): string {
    return 'Mac系统通知后端 - 使用node-notifier发送桌面通知';
  }

  getRequiredConfig(): string[] {
    return []; // 无必需配置
  }

  validateConfig(config: Record<string, any>): boolean {
    if (!config) return true;
    
    const macConfig = config as MacOSConfig;
    
    // 验证可选配置
    if (macConfig.sound && typeof macConfig.sound !== 'string') {
      throw new Error('sound 必须是字符串类型');
    }
    
    if (macConfig.subtitle && typeof macConfig.subtitle !== 'string') {
      throw new Error('subtitle 必须是字符串类型');
    }
    
    if (macConfig.timeout && typeof macConfig.timeout !== 'number') {
      throw new Error('timeout 必须是数字类型');
    }
    
    if (macConfig.appIcon && typeof macConfig.appIcon !== 'string') {
      throw new Error('appIcon 必须是字符串类型');
    }
    
    return true;
  }

  async send(title: string, message: string, config?: Record<string, any>): Promise<NotificationResult> {
    try {
      if (!notifier) {
        throw new Error('node-notifier not available - please install node-notifier package');
      }
      
      const macConfig = (config as MacOSConfig) || {};
      
      // 构建 node-notifier 选项
      const notificationOptions: any = {
        title: title,
        message: message,
        sound: macConfig.sound || true, // true 表示使用默认声音
        wait: macConfig.wait || false,
        timeout: macConfig.timeout || 5
      };
      
      // 添加可选参数
      if (macConfig.subtitle) {
        notificationOptions.subtitle = macConfig.subtitle;
      }
      
      if (macConfig.appIcon) {
        notificationOptions.appIcon = macConfig.appIcon;
      }
      
      if (macConfig.contentImage) {
        notificationOptions.contentImage = macConfig.contentImage;
      }
      
      if (macConfig.open) {
        notificationOptions.open = macConfig.open;
      }
      
      console.log(`[MacOS通知] 发送通知:`, notificationOptions);
      
      // 使用 Promise 包装 node-notifier 的回调
      await new Promise<void>((resolve, reject) => {
        notifier.notify(notificationOptions, (err: any, response: any) => {
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
          subtitle: macConfig.subtitle,
          sound: macConfig.sound || 'default',
          timeout: macConfig.timeout || 5
        }
      };
      
    } catch (error: any) {
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
  static getAvailableSounds(): string[] {
    // node-notifier 支持的 macOS 系统声音
    return [
      'Bottle', 'Blow', 'Frog', 'Funk', 'Glass', 'Hero', 
      'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'
    ];
  }

  /**
   * 创建富文本通知配置
   */
  static createRichNotification(options: {
    title: string;
    message: string;
    subtitle?: string;
    sound?: string;
    timeout?: number;
    appIcon?: string;
    contentImage?: string;
    open?: string;
  }): { title: string; message: string; config: MacOSConfig } {
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
  static createInteractiveNotification(options: {
    title: string;
    message: string;
    subtitle?: string;
    sound?: string;
    open?: string;
  }): { title: string; message: string; config: MacOSConfig } {
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