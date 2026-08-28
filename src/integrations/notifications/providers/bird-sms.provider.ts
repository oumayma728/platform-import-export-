import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BirdClient } from '@messagebird/sdk';
import type {
  ISmsProvider,
  SendSmsOptions,
} from '../interfaces/sms-provider.interface';
import { ProviderSendResult } from "../interfaces/email-provider.interface"

@Injectable()
export class BirdSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(BirdSmsProvider.name);
  private readonly bird: BirdClient;
  private readonly defaultOriginator: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SMS_SERVICE_API_KEY') || 'bk_eu1_mock_key';

    this.bird = new BirdClient({ apiKey });
    this.defaultOriginator = this.configService.get<string>(
      'SMS_ORIGINATOR',
      'ImpExp',
    );
  }

  async sendSms(options: SendSmsOptions): Promise<ProviderSendResult> {
    try {
      const originator = options.from || this.defaultOriginator;
      const formattedRecipient = this.normalizePhoneNumber(options.to);

      const result = await this.bird.sms.send({
        to: formattedRecipient,
        text: options.message,
        from: originator,
      });

      this.logger.log(
        `SMS successfully sent via Bird to [${formattedRecipient}] (ID: ${result.id})`,
      );

      return {
        messageId: result.id,
        status: result.status,
        raw: result,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to send SMS via Bird to ${options.to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private normalizePhoneNumber(phone: string): string {
    const trimmed = phone.trim();
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    // Default to adding '+' if missing
    return `+${trimmed.replace(/[^0-9]/g, '')}`;
  }
}
