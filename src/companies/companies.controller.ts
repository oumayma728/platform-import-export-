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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/api-error-response.dto';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyEntity } from './entities/company.entity';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a company',
    description: 'Creates a new company profile.',
  })
  @ApiBody({ type: CreateCompanyDto })
  @ApiCreatedResponse({
    description: 'Company created successfully.',
    type: CompanyEntity,
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
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all companies',
    description: 'Returns all companies.',
  })
  @ApiOkResponse({
    description: 'Companies retrieved successfully.',
    type: CompanyEntity,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a company by ID',
    description: 'Returns a single company by its identifier.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Company identifier.' })
  @ApiOkResponse({
    description: 'Company retrieved successfully.',
    type: CompanyEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No company exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a company',
    description: 'Updates one or more company fields.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Company identifier.' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiOkResponse({
    description: 'Company updated successfully.',
    type: CompanyEntity,
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
    description: 'No company exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a company',
    description: 'Deletes the company identified by the provided ID.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Company identifier.' })
  @ApiOkResponse({
    description: 'Company deleted successfully.',
    schema: {
      type: 'boolean',
      example: true,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No company exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
