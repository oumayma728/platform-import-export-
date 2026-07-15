import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/api-error-response.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto } from './dto/search-listing-dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingEntity } from './entities/listing.entity';
import { ListingsService } from './listings.service';

@ApiTags('Listings')
@ApiBearerAuth()
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a listing',
    description: 'Creates a new listing for an existing company.',
  })
  @ApiBody({ type: CreateListingDto })
  @ApiCreatedResponse({
    description: 'Listing created successfully.',
    type: ListingEntity,
  })
  @ApiBadRequestResponse({
    description:
      'Request body validation failed. Unknown properties are rejected by the global ValidationPipe.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The company referenced by companyId does not exist.',
    type: NotFoundErrorResponseDto,
  })
  create(@Body() createListingDto: CreateListingDto) {
    return this.listingsService.create(createListingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all listings',
    description: 'Returns all listings with their related company.',
  })
  @ApiOkResponse({
    description: 'Listings retrieved successfully.',
    type: ListingEntity,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  findAll() {
    return this.listingsService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search listings',
    description: 'Searches listings using optional filters.',
  })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['OFFRE', 'DEMANDE'] })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'SUSPENDUE', 'CLOTUREE'],
  })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'certification', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiOkResponse({
    description: 'Listing search completed successfully.',
    type: ListingEntity,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Query parameter validation failed.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  search(@Query() filters: SearchListingsDto) {
    return this.listingsService.search(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a listing by ID',
    description: 'Returns a single listing with its related company.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Listing identifier.' })
  @ApiOkResponse({
    description: 'Listing retrieved successfully.',
    type: ListingEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No listing exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a listing',
    description: 'Updates one or more listing fields.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Listing identifier.' })
  @ApiBody({ type: UpdateListingDto })
  @ApiOkResponse({
    description: 'Listing updated successfully.',
    type: ListingEntity,
  })
  @ApiBadRequestResponse({
    description:
      'Request body validation failed. Unknown properties are rejected by the global ValidationPipe.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No listing exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    return this.listingsService.update(id, updateListingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a listing',
    description: 'Deletes the listing identified by the provided ID.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Listing identifier.' })
  @ApiOkResponse({
    description: 'Listing deleted successfully.',
    type: ListingEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No listing exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.listingsService.remove(id);
  }
}
