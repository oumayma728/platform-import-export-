import { ApiProperty } from '@nestjs/swagger';
import { BillingInterval } from '@prisma/client';

export class BillingRecommendationDto {
  @ApiProperty({
    description:
      'Whether the user should prefer the selected subscription over PAYG.',
    example: true,
  })
  recommended!: boolean;

  @ApiProperty({
    description: 'Cumulative successful PAYG spending in the plan currency.',
    example: 32,
  })
  cumulativePaygSpending!: number;

  @ApiProperty({
    description: 'Subscription price used for the comparison.',
    example: 29,
  })
  subscriptionPrice!: number;

  @ApiProperty({
    description: 'Interval of the subscription price used for the comparison.',
    enum: BillingInterval,
    example: BillingInterval.MENSUEL,
  })
  subscriptionInterval!: BillingInterval;

  @ApiProperty({
    description: 'Currency of the spending and subscription price.',
    example: 'USD',
  })
  currency!: string;
}
