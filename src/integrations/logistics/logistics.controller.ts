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
import { EstimateLogisticsDto } from './dto/estimate-logistics.dto';
import { LogisticsService } from './logistics.service';

@ApiTags('Logistics')
@ApiBearerAuth()
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('estimate')
  @ApiOperation({
    summary: 'Estimate transport distance, cost, and delivery time',
    description:
      'Estimates the route distance (km), estimated transport cost (USD), and delivery time (days) between origin and destination countries using OpenRouteService API with Redis caching.',
  })
  @ApiQuery({
    name: 'from',
    required: true,
    type: String,
    example: 'Tunisia',
    description: 'Origin country name or ISO code',
  })
  @ApiQuery({
    name: 'to',
    required: true,
    type: String,
    example: 'France',
    description: 'Destination country name or ISO code',
  })
  @ApiOkResponse({
    description: 'Logistics estimate calculated successfully.',
    schema: {
      type: 'object',
      properties: {
        origin_country: { type: 'string', example: 'Tunisia' },
        destination_country: { type: 'string', example: 'France' },
        distance_km: { type: 'number', example: 1780.5 },
        estimated_cost_usd: { type: 'number', example: 851.23 },
        estimated_days: { type: 'number', example: 5 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Query parameter validation failed or country could not be located.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  estimate(@Query() query: EstimateLogisticsDto) {
    return this.logisticsService.calculate_route(query.from, query.to);
  }
}
