import { NotificationBackend, NotificationResult, SlackConfig } from '../notification/types.js';

export class SlackBackend implements NotificationBackend {
  getDescription(): string {
    return 'Slack通知后端 - 通过Webhook或API发送Slack消息';
  }

  getRequiredConfig(): string[] {
    return ['webhookUrl'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.webhookUrl && typeof config.webhookUrl === 'string' && 
             config.webhookUrl.includes('hooks.slack.com'));
  }

  async send(
    title: string,
    message: string,
    config?: Record<string, any>
  ): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('Slack配置无效，需要提供有效的webhookUrl');
    }

    const slackConfig = config as SlackConfig;
    
    try {
      const payload = this.createSlackMessage(title, message, slackConfig);

      const response = await fetch(slackConfig.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack API错误: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      
      console.log(`[SLACK] 发送到频道: ${slackConfig.channel || 'default'}`);
      console.log(`[SLACK] 标题: ${title}`);
      console.log(`[SLACK] 响应: ${responseText}`);

      return {
        messageId: `slack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          channel: slackConfig.channel,
          username: slackConfig.username,
          response: responseText
        }
      };
    } catch (error) {
      throw new Error(`Slack发送失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private createSlackMessage(title: string, message: string, config: SlackConfig) {
    const payload: any = {
      text: title,
      attachments: [
        {
          color: 'good',
          text: message,
          ts: Math.floor(Date.now() / 1000),
          footer: 'Notice MCP',
          footer_icon: '🤖'
        }
      ]
    };

    // 添加可选配置
    if (config.channel) {
      payload.channel = config.channel;
    }
    
    if (config.username) {
      payload.username = config.username;
    }
    
    if (config.iconEmoji) {
      payload.icon_emoji = config.iconEmoji;
    }

    return payload;
  }

  /**
   * 使用Slack API Token发送消息（需要安装@slack/web-api）
   */
  private async sendWithToken(
    title: string,
    message: string,
    config: SlackConfig
  ): Promise<string> {
    if (!config.token) {
      throw new Error('需要提供Slack API Token');
    }

    // 示例代码，需要安装 @slack/web-api
    /*
    const { WebClient } = require('@slack/web-api');
    
    const slack = new WebClient(config.token);
    
    const result = await slack.chat.postMessage({
      channel: config.channel || '#general',
      text: title,
      attachments: [
        {
          color: 'good',
          text: message,
          ts: Math.floor(Date.now() / 1000)
        }
      ],
      username: config.username,
      icon_emoji: config.iconEmoji
    });
    
    return result.ts as string;
    */
    
    throw new Error('Slack API Token功能需要安装@slack/web-api依赖');
  }

  /**
   * 创建富文本格式的Slack消息
   */
  static createRichMessage(
    title: string,
    message: string,
    options: {
      color?: string;
      fields?: Array<{ title: string; value: string; short?: boolean }>;
      imageUrl?: string;
    } = {}
  ) {
    return {
      text: title,
      attachments: [
        {
          color: options.color || 'good',
          text: message,
          fields: options.fields,
          image_url: options.imageUrl,
          ts: Math.floor(Date.now() / 1000),
          footer: 'Notice MCP',
          footer_icon: '🤖'
        }
      ]
    };
  }
}