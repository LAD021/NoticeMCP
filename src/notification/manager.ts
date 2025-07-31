import { NotificationBackend, NotificationResult } from './types.js';

export class NotificationManager {
  private backends: Map<string, NotificationBackend> = new Map();

  /**
   * 注册通知后端
   */
  registerBackend(name: string, backend: NotificationBackend): void {
    this.backends.set(name, backend);
  }

  /**
   * 获取所有可用的后端名称
   */
  getAvailableBackends(): string[] {
    return Array.from(this.backends.keys());
  }

  /**
   * 发送通知
   */
  async sendNotification(
    title: string,
    message: string,
    backendName: string,
    config?: Record<string, any>
  ): Promise<NotificationResult> {
    const backend = this.backends.get(backendName);
    if (!backend) {
      throw new Error(`未找到后端: ${backendName}`);
    }

    try {
      const result = await backend.send(title, message, config);
      return {
        success: true,
        backend: backendName,
        timestamp: new Date().toISOString(),
        ...result
      };
    } catch (error) {
      return {
        success: false,
        backend: backendName,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 批量发送通知到多个后端
   */
  async sendToMultipleBackends(
    title: string,
    message: string,
    backends: Array<{ name: string; config?: Record<string, any> }>
  ): Promise<NotificationResult[]> {
    const promises = backends.map(({ name, config }) =>
      this.sendNotification(title, message, name, config)
    );
    
    return Promise.allSettled(promises).then(results =>
      results.map(result => 
        result.status === 'fulfilled' 
          ? result.value 
          : {
              success: false,
              backend: 'unknown',
              timestamp: new Date().toISOString(),
              error: result.reason?.message || '发送失败'
            }
      )
    );
  }
}