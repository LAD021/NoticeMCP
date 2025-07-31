import { NotificationBackend, NotificationResult, EmailConfig } from '../notification/types.js';

export class EmailBackend implements NotificationBackend {
  getDescription(): string {
    return '邮件通知后端 - 通过SMTP发送邮件通知';
  }

  getRequiredConfig(): string[] {
    return ['to'];
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.to && (typeof config.to === 'string' || Array.isArray(config.to)));
  }

  async send(
    title: string,
    message: string,
    config?: Record<string, any>
  ): Promise<Partial<NotificationResult>> {
    if (!config || !this.validateConfig(config)) {
      throw new Error('邮件配置无效，需要提供收件人地址 (to)');
    }

    const emailConfig = config as EmailConfig;
    
    // 模拟邮件发送（实际项目中需要使用nodemailer等库）
    try {
      // 这里应该集成真实的邮件发送服务
      // 例如使用 nodemailer, AWS SES, SendGrid 等
      
      const recipients = Array.isArray(emailConfig.to) ? emailConfig.to : [emailConfig.to];
      const subject = emailConfig.subject || title;
      
      // 模拟发送延迟
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`[EMAIL] 发送邮件到: ${recipients.join(', ')}`);
      console.log(`[EMAIL] 主题: ${subject}`);
      console.log(`[EMAIL] 内容: ${message}`);
      
      return {
        messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          recipients,
          subject,
          method: 'smtp'
        }
      };
    } catch (error) {
      throw new Error(`邮件发送失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建真实的邮件发送实现示例
   * 需要安装 nodemailer: npm install nodemailer @types/nodemailer
   */
  private async sendRealEmail(
    title: string,
    message: string,
    config: EmailConfig
  ): Promise<string> {
    // 示例代码，需要取消注释并安装依赖
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: config.smtp?.host || 'smtp.gmail.com',
      port: config.smtp?.port || 587,
      secure: config.smtp?.secure || false,
      auth: config.smtp?.auth
    });
    
    const mailOptions = {
      from: config.from || config.smtp?.auth?.user,
      to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
      subject: config.subject || title,
      text: message,
      html: `<div><h3>${title}</h3><p>${message}</p></div>`
    };
    
    const info = await transporter.sendMail(mailOptions);
    return info.messageId;
    */
    
    throw new Error('真实邮件发送功能需要配置SMTP服务器');
  }
}