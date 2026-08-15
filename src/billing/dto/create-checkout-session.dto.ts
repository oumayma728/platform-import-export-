import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionResponseDto {
  @ApiProperty({
    description: 'The Stripe Checkout Session ID',
    example: 'cs_test_a1b2c3d4e5f6',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'The URL to redirect the user to Stripe Checkout',
    example: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6',
  })
  checkoutUrl!: string;
}
