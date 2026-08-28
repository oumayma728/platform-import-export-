import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BirdClient } from '@messagebird/sdk';
import type {
  IEmailProvider,
  ProviderSendResult,
  SendEmailOptions,
} from '../interfaces/email-provider.interface';

@Injectable()
export class BirdEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(BirdEmailProvider.name);
  private readonly bird: BirdClient;
  private readonly defaultSenderEmail: string;
  private readonly defaultSenderName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('EMAIL_SERVICE_API_KEY') || 'bk_eu1_mock_key';

    this.bird = new BirdClient({ apiKey });
    this.defaultSenderEmail = this.configService.get<string>('EMAIL_FROM_ADDRESS') || 'no-reply@import-export.platform';
    this.defaultSenderName = this.configService.get<string>('EMAIL_FROM_NAME') || 'ImportExport Platform';
  }

  async sendEmail(options: SendEmailOptions): Promise<ProviderSendResult> {
    try {
      const recipientList = Array.isArray(options.to)
        ? options.to
        : [options.to];

      const fromAddress = options.from?.email || this.defaultSenderEmail;
      const fromName = options.from?.name || this.defaultSenderName;

      const htmlContent =
        options.html ||
        `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">${options.body.replace(/\n/g, '<br/>')}</div>`;

      const result = await this.bird.email.send({
        from: {
          email: fromAddress,
          name: fromName,
        },
        to: recipientList,
        subject: options.subject,
        html: htmlContent,
        headers: { 'Idempotency-Key': `email-${options.to}-${options.subject}-${Date.now()}` },
      });

      this.logger.log(
        `Email successfully sent via Bird to [${recipientList.join(', ')}] with subject: "${options.subject}" (ID: ${result.id})`,
      );

      return {
        messageId: result.id,
        status: result.status,
        raw: result,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send email via Bird to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
