import {
  Controller,
  Post,
  Get,
  Query,
  DefaultValuePipe,
  ParseEnumPipe,
  Param,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthRequest } from '../auth/interfaces/auth-request';
import { CreateCheckoutSessionResponseDto } from './dto/create-checkout-session.dto';
import { CancelSubscriptionResponseDto } from './dto/cancel-subscription.dto';
import { BillingRecommendationDto } from './dto/billing-recommendation.dto';
import { BillingInterval } from '@prisma/client';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @ApiOperation({
    summary: 'Get subscription recommendation',
    description:
      "Compares the authenticated user's cumulative successful PAYG spending ($2 per conversation) with the selected active subscription price. The recommendation is calculated by the backend using a strict spending-greater-than-price rule.",
  })
  @ApiOkResponse({
    description: 'PAYG spending and subscription comparison returned.',
    type: BillingRecommendationDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid subscription interval.' })
  @ApiUnauthorizedResponse({
    description: 'The provided credentials are invalid.',
  })
  @ApiQuery({
    name: 'interval',
    required: false,
    enum: BillingInterval,
    description:
      'Subscription interval to compare against. Defaults to monthly.',
    example: BillingInterval.MENSUEL,
  })
  @Get('/recommendation')
  async getBillingRecommendation(
    @CurrentUser() user: AuthRequest['user'],
    @Query(
      'interval',
      new DefaultValuePipe(BillingInterval.MENSUEL),
      new ParseEnumPipe(BillingInterval),
    )
    interval: BillingInterval,
  ): Promise<BillingRecommendationDto> {
    return this.billingService.getBillingRecommendation(user.id, interval);
  }

  @ApiOperation({
    summary: 'Create Checkout Session',
    description:
      'Creates a new Stripe checkout session for the authenticated user and returns the redirect URL.',
  })
  @ApiOkResponse({
    description: 'Checkout session created successfully.',
    type: CreateCheckoutSessionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid subscription plan or parameters.',
  })
  @ApiUnauthorizedResponse({
    description: 'The provided credentials are invalid.',
  })
  @Post('/subscription/:id/checkout')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @CurrentUser() user: AuthRequest['user'],
    @Param('id') id: string,
  ): Promise<CreateCheckoutSessionResponseDto> {
    return this.billingService.startSubscriptionCheckout(user.id, id);
  }

  @ApiOperation({
    summary: 'Stripe Webhook',
    description: 'Public webhook endpoint for Stripe event notifications.',
  })
  @ApiOkResponse({ description: 'Webhook event received and processed.' })
  @ApiBadRequestResponse({ description: 'Invalid payload or signature.' })
  @Public()
  @Post('/webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException(
        'Raw request body is missing for Stripe webhook verification.',
      );
    }
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    return this.billingService.handleStripeWebhook(req.rawBody, signature);
  }

  @ApiOperation({
    summary: 'Cancel Subscription',
    description:
      'Schedules cancellation of the active subscription at the end of the current billing period.',
  })
  @ApiOkResponse({
    description: 'Subscription cancellation scheduled successfully.',
    type: CancelSubscriptionResponseDto,
  })
  @ApiBadRequestResponse({ description: 'No active subscription found.' })
  @ApiUnauthorizedResponse({
    description: 'The provided credentials are invalid.',
  })
  @Post('/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(
    @CurrentUser() user: AuthRequest['user'],
  ): Promise<CancelSubscriptionResponseDto> {
    return this.billingService.cancelSubscription(user.id);
  }
}
