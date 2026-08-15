import { ApiProperty } from '@nestjs/swagger';

export class CancelSubscriptionResponseDto {
  @ApiProperty({
    description: 'Status message regarding the cancellation request',
    example: 'Subscription cancellation scheduled at the end of the billing period.',
  })
  message!: string;

  @ApiProperty({
    description: 'Whether the subscription remains active until period end',
    example: true,
  })
  cancelAtPeriodEnd!: boolean;

  @ApiProperty({
    description: 'The end date of the current paid billing period',
    example: '2026-09-14T12:00:00.000Z',
    nullable: true,
  })
  currentPeriodEnd!: Date | null;
}
