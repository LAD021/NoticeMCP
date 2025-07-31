// Mac系统通知后端实现
import { NotificationBackend, NotificationResult } from '../notification/types';

// Node.js类型声明
declare const require: (id: string) => any;

// 动态导入Node.js模块
const childProcess = (() => {
  try {
    return require('child_process');
  } catch {
    return null;
  }
})();

const util = (() => {
  try {
    return require('util');
  } catch {
    return null;
  }
})();

const execAsync = util ? util.promisify(childProcess?.exec) : null;

export interface MacOSConfig {
  sound?: string; // 通知声音，如 'default', 'Glass', 'Hero', 'Ping' 等
  subtitle?: string; // 副标题
  timeout?: number; // 超时时间（秒）
  appIcon?: string; // 应用图标路径
}

export class MacOSBackend implements NotificationBackend {
  getDescription(): string {
    return 'Mac系统通知后端 - 使用macOS原生通知系统发送桌面通知';
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
    
    if (macConfig.timeout && (typeof macConfig.timeout !== 'number' || macConfig.timeout <= 0)) {
      throw new Error('timeout 必须是正数');
    }
    
    if (macConfig.appIcon && typeof macConfig.appIcon !== 'string') {
      throw new Error('appIcon 必须是字符串类型');
    }
    
    return true;
  }

  async send(title: string, message: string, config?: Record<string, any>): Promise<NotificationResult> {
    try {
      if (!execAsync) {
        throw new Error('execAsync not available - Node.js child_process module required');
      }
      
      const macConfig = (config as MacOSConfig) || {};
      
      // 构建 osascript 命令
      let script = `display notification "${this.escapeString(message)}" with title "${this.escapeString(title)}"`;
      
      // 添加可选参数
      if (macConfig.subtitle) {
        script += ` subtitle "${this.escapeString(macConfig.subtitle)}"`;
      }
      
      if (macConfig.sound) {
        script += ` sound name "${this.escapeString(macConfig.sound)}"`;
      }
      
      // 执行 osascript 命令
      const command = `osascript -e '${script}'`;
      
      console.log(`[MacOS通知] 执行命令: ${command}`);
      
      await execAsync(command);
      
      return {
        success: true,
        backend: 'macos',
        messageId: `macos-${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {
          title,
          message,
          subtitle: macConfig.subtitle,
          sound: macConfig.sound || 'default'
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
   * 转义字符串中的特殊字符，防止AppleScript注入
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')  // 转义反斜杠
      .replace(/"/g, '\\"')     // 转义双引号
      .replace(/'/g, "\\'")     // 转义单引号
      .replace(/\n/g, '\\n')    // 转义换行符
      .replace(/\r/g, '\\r')    // 转义回车符
      .replace(/\t/g, '\\t');   // 转义制表符
  }

  /**
   * 获取可用的系统声音列表
   */
  static async getAvailableSounds(): Promise<string[]> {
    try {
      if (!execAsync) {
        throw new Error('execAsync not available');
      }
      const { stdout } = await execAsync('ls /System/Library/Sounds/*.aiff | xargs -I {} basename {} .aiff');
      return stdout.trim().split('\n').filter((sound: string) => sound.length > 0);
    } catch (error) {
      console.warn('[MacOS通知] 无法获取系统声音列表:', error);
      return ['default', 'Glass', 'Hero', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Blow', 'Bottle', 'Frog', 'Funk', 'Morse', 'Tink'];
    }
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
  }): { title: string; message: string; config: MacOSConfig } {
    return {
      title: options.title,
      message: options.message,
      config: {
        subtitle: options.subtitle,
        sound: options.sound || 'default',
        timeout: options.timeout || 5
      }
    };
  }

  /**
   * 发送带有操作按钮的通知（需要更高权限）
   */
  static async sendActionableNotification(options: {
    title: string;
    message: string;
    buttons: string[];
    defaultButton?: string;
  }): Promise<{ success: boolean; buttonClicked?: string; error?: string }> {
    try {
      if (!execAsync) {
        throw new Error('execAsync not available');
      }
      
      const buttons = options.buttons.map(btn => `"${btn}"`).join(', ');
      const defaultButton = options.defaultButton || options.buttons[0];
      
      const script = `display dialog "${options.message}" with title "${options.title}" buttons {${buttons}} default button "${defaultButton}"`;
      const command = `osascript -e '${script}'`;
      
      const { stdout } = await execAsync(command);
      const buttonClicked = stdout.match(/button returned:(.+)/)?.[1]?.trim();
      
      return {
        success: true,
        buttonClicked: buttonClicked || defaultButton
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default MacOSBackend;