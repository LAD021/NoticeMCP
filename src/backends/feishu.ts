import { NotificationBackend, NotificationResult } from '../notification/types.js';

export interface FeishuConfig {
  webhook: string[];
  secret?: string;
  atAll?: boolean;
  atMobiles?: string[];
  atUserIds?: string[];
}

export class FeishuBackend implements NotificationBackend {
  getDescription(): string {
    return '飞书通知后端 - 通过Webhook发送飞书群消息';
  }

  getRequiredConfig(): string[] {
    return ['webhook'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.webhook && 
             Array.isArray(config.webhook) && 
             config.webhook.length > 0 &&
             config.webhook.every((url: string) => 
               typeof url === 'string' && url.includes('open.feishu.cn')));
  }

  async send(title: string, message: string, config?: Record<string, any>): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('飞书配置无效，需要提供有效的webhook数组');
    }

    // 构建飞书消息格式
    const payload: any = {
      msg_type: 'interactive',
      card: {
        elements: [
          {
            tag: 'div',
            text: {
              content: `**${title}**\n\n${message}`,
              tag: 'lark_md'
            }
          }
        ],
        header: {
          title: {
            content: title,
            tag: 'plain_text'
          },
          template: 'blue'
        }
      }
    };

    // 添加@功能
    if (config.atAll) {
      payload.card.elements.push({
        tag: 'div',
        text: {
          content: '<at user_id="all">所有人</at>',
          tag: 'lark_md'
        }
      });
    }

    if (config.atUserIds && config.atUserIds.length > 0) {
      const atUsers = config.atUserIds.map((userId: string) => `<at user_id="${userId}"></at>`).join(' ');
      payload.card.elements.push({
        tag: 'div',
        text: {
          content: atUsers,
          tag: 'lark_md'
        }
      });
    }

    // 如果有签名密钥，生成签名
    let headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.secret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `${timestamp}\n${config.secret}`;
      const crypto = await import('crypto');
      const sign = crypto.createHmac('sha256', stringToSign).digest('base64');
      
      payload.timestamp = timestamp;
      payload.sign = sign;
    }

    // 并行发送到所有webhook URL
    const sendPromises = config.webhook.map(async (webhookUrl: string, index: number) => {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`飞书API错误: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (result.code !== 0) {
          throw new Error(`飞书发送失败: ${result.msg}`);
        }

        console.error(`[FEISHU] 消息已发送到webhook ${index + 1}`);
        return {
          success: true,
          webhookIndex: index,
          webhookUrl,
          response: result
        };
      } catch (error: any) {
        console.error(`[FEISHU] webhook ${index + 1} 发送失败: ${error.message}`);
        return {
          success: false,
          webhookIndex: index,
          webhookUrl,
          error: error.message
        };
      }
    });

    try {
      const results = await Promise.all(sendPromises);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      console.error(`[FEISHU] 标题: ${title}`);
      console.error(`[FEISHU] 发送结果: ${successCount}成功, ${failureCount}失败`);

      // 如果至少有一个成功，则认为发送成功
      if (successCount === 0) {
        const errors = results.filter(r => !r.success).map(r => r.error).join('; ');
        throw new Error(`所有飞书webhook发送失败: ${errors}`);
      }

      return {
        messageId: `feishu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          results,
          successCount,
          failureCount,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      throw new Error(`飞书发送失败: ${error.message}`);
    }
  }
}