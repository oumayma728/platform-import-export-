import type { ProviderSendResult } from './email-provider.interface';

export interface SendSmsOptions {
  to: string;
  message: string;
  from?: string;
}

export interface ISmsProvider {
  sendSms(options: SendSmsOptions): Promise<ProviderSendResult>;
}
