export interface EmailJobData {
  logId: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  userId?: string;
}

export interface SmsJobData {
  logId: string;
  phone: string;
  message: string;
  userId?: string;
}
