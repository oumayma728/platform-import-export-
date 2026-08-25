import { Controller } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly emailService: EmailService) {}
}
