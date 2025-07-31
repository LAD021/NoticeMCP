import { NotificationBackend, NotificationResult, WebhookConfig } from '../notification/types.js';

export class WebhookBackend implements NotificationBackend {
  getDescription(): string {
    return 'Webhook通知后端 - 通过HTTP请求发送通知到指定URL';
  }

  getRequiredConfig(): string[] {
    return ['url'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.url && typeof config.url === 'string' && config.url.startsWith('http'));
  }

  async send(
    title: string,
    message: string,
    config?: Record<string, any>
  ): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('Webhook配置无效，需要提供有效的URL');
    }

    const webhookConfig = config as WebhookConfig;
    
    try {
      const payload = {
        title,
        message,
        timestamp: new Date().toISOString(),
        source: 'notice-mcp'
      };

      const requestOptions: RequestInit = {
        method: webhookConfig.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'notice-mcp/1.0.0',
          ...webhookConfig.headers
        },
        body: JSON.stringify(payload)
      };

      // 设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhookConfig.timeout || 10000);
      requestOptions.signal = controller.signal;

      const response = await fetch(webhookConfig.url, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      console.log(`[WEBHOOK] 发送到: ${webhookConfig.url}`);
      console.log(`[WEBHOOK] 状态: ${response.status}`);
      console.log(`[WEBHOOK] 响应: ${responseText.substring(0, 200)}`);

      return {
        messageId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          url: webhookConfig.url,
          method: webhookConfig.method || 'POST',
          statusCode: response.status,
          response: responseData
        }
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Webhook请求超时: ${webhookConfig.url}`);
      }
      throw new Error(`Webhook发送失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建常见的Webhook格式
   */
  static createSlackPayload(title: string, message: string): Record<string, any> {
    return {
      text: title,
      attachments: [
        {
          color: 'good',
          text: message,
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
  }

  static createDiscordPayload(title: string, message: string): Record<string, any> {
    return {
      embeds: [
        {
          title,
          description: message,
          color: 0x00ff00,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  static createTeamsPayload(title: string, message: string): Record<string, any> {
    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: '0076D7',
      summary: title,
      sections: [
        {
          activityTitle: title,
          activitySubtitle: new Date().toLocaleString(),
          text: message
        }
      ]
    };
  }
}