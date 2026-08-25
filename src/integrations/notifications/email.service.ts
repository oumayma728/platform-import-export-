import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BirdClient,
  type EmailMessage,
  type EmailSendParams,
} from '@messagebird/sdk';

@Injectable()
export class EmailService {
  private readonly bird: BirdClient;

  constructor(private readonly configService: ConfigService) {
    this.bird = new BirdClient({
      apiKey: this.configService.getOrThrow<string>('EMAIL_SERVICE_API_KEY'),
    });
  }

  send(params: EmailSendParams): Promise<EmailMessage> {
    return this.bird.email.send(params);
  }
}
