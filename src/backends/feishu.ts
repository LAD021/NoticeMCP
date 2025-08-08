import { NotificationBackend, NotificationResult } from '../notification/types.js';

/**
 * 飞书配置接口
 */
export interface FeishuConfig {
  webhookUrl: string;
  secret?: string; // 签名校验密钥
  atAll?: boolean; // 是否@所有人
  atUsers?: string[]; // @指定用户的open_id列表
  atMobiles?: string[]; // @指定用户的手机号列表
}

/**
 * 飞书通知后端
 * 支持通过飞书机器人Webhook发送消息
 */
export class FeishuBackend implements NotificationBackend {
  getDescription(): string {
    return '飞书通知后端 - 通过飞书机器人Webhook发送消息到飞书群聊';
  }

  getRequiredConfig(): string[] {
    return ['webhookUrl'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(
      config.webhookUrl &&
      typeof config.webhookUrl === 'string' &&
      config.webhookUrl.includes('open.feishu.cn')
    );
  }

  async send(
    title: string,
    message: string,
    config?: Record<string, any>
  ): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('飞书配置无效，需要提供有效的webhookUrl');
    }

    const feishuConfig = config as FeishuConfig;
    
    try {
      const payload = this.createFeishuPayload(title, message, feishuConfig);
      
      // 如果配置了签名密钥，添加签名
      if (feishuConfig.secret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const sign = await this.generateSign(timestamp, feishuConfig.secret);
        payload.timestamp = timestamp.toString();
        payload.sign = sign;
      }

      const response = await fetch(feishuConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'notice-mcp/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`飞书API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(`飞书消息发送失败: ${result.msg || '未知错误'}`);
      }

      return {
        success: true,
        backend: 'feishu',
        timestamp: new Date().toISOString(),
        messageId: `feishu-${Date.now()}`,
        metadata: {
          webhookUrl: feishuConfig.webhookUrl,
          hasSecret: !!feishuConfig.secret,
          atAll: feishuConfig.atAll,
          atUsersCount: feishuConfig.atUsers?.length || 0,
          atMobilesCount: feishuConfig.atMobiles?.length || 0
        }
      };
    } catch (error) {
      throw new Error(`飞书通知发送失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 创建飞书消息载荷
   */
  private createFeishuPayload(title: string, message: string, config: FeishuConfig): any {
    const content = {
      text: `**${title}**\n\n${message}`
    };

    // 添加@功能
    if (config.atAll) {
      content.text += '\n\n<at user_id="all">所有人</at>';
    }

    if (config.atUsers && config.atUsers.length > 0) {
      config.atUsers.forEach(userId => {
        content.text += `\n<at user_id="${userId}"></at>`;
      });
    }

    if (config.atMobiles && config.atMobiles.length > 0) {
      config.atMobiles.forEach(mobile => {
        content.text += `\n<at user_id="${mobile}"></at>`;
      });
    }

    return {
      msg_type: 'text',
      content
    };
  }

  /**
   * 生成飞书Webhook签名
   */
  private async generateSign(timestamp: number, secret: string): Promise<string> {
    const stringToSign = `${timestamp}\n${secret}`;
    
    // 使用Node.js内置的crypto模块
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', stringToSign);
    return hmac.digest('base64');
  }

  /**
   * 创建富文本消息载荷（支持更复杂的格式）
   */
  static createRichTextPayload(title: string, message: string, config?: FeishuConfig): any {
    const elements: any[] = [
      {
        tag: 'text',
        text: title,
        style: {
          bold: true,
          color: 'blue'
        }
      },
      {
        tag: 'text',
        text: '\n\n'
      },
      {
        tag: 'text',
        text: message
      }
    ];

    // 添加@功能到富文本
    if (config?.atAll) {
      elements.push({
        tag: 'text',
        text: '\n\n'
      });
      elements.push({
        tag: 'at',
        user_id: 'all',
        user_name: '所有人'
      });
    }

    return {
      msg_type: 'rich_text',
      content: {
        rich_text: {
          elements
        }
      }
    };
  }

  /**
   * 创建卡片消息载荷（支持更丰富的交互）
   */
  static createCardPayload(title: string, message: string, config?: FeishuConfig): any {
    const card = {
      config: {
        wide_screen_mode: true
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**${title}**`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            content: message,
            tag: 'lark_md'
          }
        },
        {
          tag: 'div',
          text: {
            content: `发送时间：${new Date().toLocaleString('zh-CN')}`,
            tag: 'plain_text'
          }
        }
      ]
    };

    return {
      msg_type: 'interactive',
      card
    };
  }
}