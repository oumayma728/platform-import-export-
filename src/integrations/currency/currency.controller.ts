import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
} from '../../common/dto/api-error-response.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { CurrencyService } from './currency.service';

@ApiTags('Currency')
@ApiBearerAuth()
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('convert')
  @ApiOperation({
    summary: 'Convert a currency amount',
    description:
      'Converts an amount from one currency to another using live exchange rates from Frankfurter API. Rates are cached in Redis for 1 hour.',
  })
  @ApiQuery({ name: 'amount', required: true, type: Number, example: 100 })
  @ApiQuery({ name: 'from', required: true, type: String, example: 'EUR' })
  @ApiQuery({ name: 'to', required: true, type: String, example: 'USD' })
  @ApiOkResponse({
    description: 'Conversion completed successfully.',
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100 },
        from: { type: 'string', example: 'EUR' },
        to: { type: 'string', example: 'USD' },
        convertedAmount: { type: 'number', example: 116.05 },
        rate: { type: 'number', example: 1.1605 },
        date: { type: 'string', example: '2026-08-19' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Query parameter validation failed.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  convert(@Query() query: ConvertCurrencyDto) {
    return this.currencyService.convert(query.amount, query.from, query.to);
  }
}
