import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { buildLowStockEmail, buildPasswordResetEmail, buildWelcomeEmail } from '../utils/email-templates.js';

interface SendEmailPayload {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private resolveRecipients(raw: string): string[] {
    return raw
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    if (env.EMAIL_PROVIDER === 'console') {
      logger.info('Mock email sent', {
        to: payload.to,
        subject: payload.subject,
      });
      return;
    }

    if (env.EMAIL_PROVIDER !== 'sendgrid') {
      logger.warn('Email provider not supported, skipping send', { provider: env.EMAIL_PROVIDER });
      return;
    }

    if (!env.SENDGRID_API_KEY) {
      logger.warn('SendGrid API key not configured');
      return;
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: payload.to.map((email) => ({ email })),
          },
        ],
        from: {
          email: env.EMAIL_FROM,
          name: env.EMAIL_FROM_NAME,
        },
        subject: payload.subject,
        content: [
          { type: 'text/plain', value: payload.text || payload.subject },
          { type: 'text/html', value: payload.html },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('Failed to send email', { status: response.status, errorBody });
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  async sendWelcomeEmail(params: { name: string; email: string }): Promise<void> {
    const template = buildWelcomeEmail(params.name, env.APP_BASE_URL);
    await this.sendEmail({
      to: [params.email],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordResetEmail(params: { name: string; email: string; token: string; expiresHours: number }): Promise<void> {
    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${params.token}`;
    const template = buildPasswordResetEmail(params.name, resetUrl, params.expiresHours);
    await this.sendEmail({
      to: [params.email],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendLowStockAlert(params: {
    tankName: string;
    productName?: string;
    siteName?: string;
    currentVolume: number;
    minAlert: number;
  }): Promise<void> {
    const recipients = this.resolveRecipients(env.EMAIL_ALERT_RECIPIENTS);
    if (recipients.length === 0) {
      logger.info('Low stock alert skipped: no recipients configured');
      return;
    }

    const template = buildLowStockEmail({ ...params, appUrl: env.APP_BASE_URL });
    await this.sendEmail({
      to: recipients,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

export const emailService = new EmailService();
