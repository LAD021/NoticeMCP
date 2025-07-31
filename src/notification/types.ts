/**
 * 通知结果接口
 */
export interface NotificationResult {
  success: boolean;
  backend: string;
  timestamp: string;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 通知后端接口
 */
export interface NotificationBackend {
  /**
   * 发送通知
   * @param title 通知标题
   * @param message 通知内容
   * @param config 后端特定配置
   */
  send(
    title: string,
    message: string,
    config?: Record<string, any>
  ): Promise<Partial<NotificationResult>>;

  /**
   * 验证配置是否有效
   * @param config 配置对象
   */
  validateConfig?(config: Record<string, any>): boolean;

  /**
   * 获取后端描述信息
   */
  getDescription(): string;

  /**
   * 获取所需的配置字段
   */
  getRequiredConfig(): string[];
}

/**
 * 邮件配置接口
 */
export interface EmailConfig {
  to: string | string[];
  from?: string;
  subject?: string;
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  };
}

/**
 * Webhook配置接口
 */
export interface WebhookConfig {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Slack配置接口
 */
export interface SlackConfig {
  webhookUrl?: string;
  token?: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}