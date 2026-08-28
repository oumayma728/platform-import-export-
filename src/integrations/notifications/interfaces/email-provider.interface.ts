export interface EmailSenderInfo {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: EmailSenderInfo;
}

export interface ProviderSendResult {
  messageId?: string;
  status?: string;
  raw?: unknown;
}

export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<ProviderSendResult>;
}
