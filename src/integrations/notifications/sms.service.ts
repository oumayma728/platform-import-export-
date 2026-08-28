import { Injectable } from '@nestjs/common';
import {
  NotificationsService,
  type SendSmsOptions,
} from './notifications.service';

@Injectable()
export class SmsService {
  constructor(private readonly notificationsService: NotificationsService) {}

  send(phone: string, message: string, options?: SendSmsOptions) {
    return this.notificationsService.send_sms(phone, message, options);
  }
}
