import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { GetNotificationLogsQueryDto } from './dto/get-notification-logs-query.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { SendTestSmsDto } from './dto/send-test-sms.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthRequest } from '../../auth/interfaces/auth-request';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List notification logs (Admin only)',
    description:
      'Retrieves paginated history of all dispatched emails and SMS with delivery statuses and attempt counts.',
  })
  @ApiResponse({ status: 200, description: 'List of notification logs.' })
  async getLogs(@Query() query: GetNotificationLogsQueryDto) {
    return this.notificationsService.getNotificationLogs({
      userId: query.userId,
      channel: query.channel,
      status: query.status,
      skip: query.skip,
      take: query.take,
    });
  }

  @Get('logs/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get notification log details by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'UUID of the notification log' })
  @ApiResponse({ status: 200, description: 'Notification log details.' })
  @ApiResponse({ status: 404, description: 'Notification log not found.' })
  async getLogById(@Param('id') id: string) {
    return this.notificationsService.getNotificationLogById(id);
  }

  @Post('logs/:id/retry')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry a failed notification (Admin only)',
    description:
      'Re-enqueues a failed notification for redelivery via BullMQ.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the notification log' })
  @ApiResponse({
    status: 200,
    description: 'Notification re-enqueued successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Notification is not in FAILED status.',
  })
  @ApiResponse({ status: 404, description: 'Notification log not found.' })
  async retryLog(@Param('id') id: string) {
    return this.notificationsService.retryNotification(id);
  }

  @Post('retry-failed')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch retry all failed notifications (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'All failed notifications re-enqueued.',
  })
  async retryAllFailed() {
    return this.notificationsService.retryAllFailed();
  }

  @Post('test/email')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send test email (Admin only)',
  })
  @ApiResponse({ status: 202, description: 'Test email enqueued.' })
  async sendTestEmail(
    @Body() dto: SendTestEmailDto,
    @CurrentUser() user: AuthRequest['user'],
  ) {
    return this.notificationsService.send_email(
      dto.to,
      dto.subject,
      dto.body,
      {
        userId: user.id,
        html: dto.html,
        metadata: { isTest: true },
      },
    );
  }

  @Post('test/sms')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send test SMS (Admin only)',
  })
  @ApiResponse({ status: 202, description: 'Test SMS enqueued.' })
  async sendTestSms(
    @Body() dto: SendTestSmsDto,
    @CurrentUser() user: AuthRequest['user'],
  ) {
    return this.notificationsService.send_sms(dto.phone, dto.message, {
      userId: user.id,
      metadata: { isTest: true },
    });
  }
}
