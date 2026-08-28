import { Injectable } from '@nestjs/common';
import {
  NotificationsService,
  type SendEmailOptions,
} from './notifications.service';

@Injectable()
export class EmailService {
  constructor(private readonly notificationsService: NotificationsService) {}

  send(to: string, subject: string, body: string, options?: SendEmailOptions) {
    return this.notificationsService.send_email(to, subject, body, options);
  }
}
