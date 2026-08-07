import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import {
  ForbiddenErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
} from '../common/dto/api-error-response.dto';
import { CompanyEntity } from '../companies/entities/company.entity';
import { AdminService } from './admin.service';
import { GetCompaniesFilterDto } from './dto/get-companies-filter.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('companies')
  @ApiOperation({
    summary: 'List companies by validation status',
    description:
      'Returns companies filtered by status (defaults to EN_ATTENTE_VALIDATION for admin validation dashboard).',
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
  @ApiForbiddenResponse({
    description: 'Only admins can perform this action.',
    type: ForbiddenErrorResponseDto,
  })
  getCompanies(@Query() filterDto: GetCompaniesFilterDto) {
    return this.adminService.getCompanies(filterDto);
  }

  @Patch('companies/:id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate a company',
    description: 'Sets the validationStatus of the target company to VALIDE.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Company identifier.' })
  @ApiOkResponse({
    description: 'Company validation status set to VALIDE.',
    type: CompanyEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only admins can perform this action.',
    type: ForbiddenErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No company exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  validateCompany(@Param('id') id: string) {
    return this.adminService.validateCompany(id);
  }

  @Patch('companies/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a company',
    description: 'Sets the validationStatus of the target company to REJETE.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Company identifier.' })
  @ApiOkResponse({
    description: 'Company validation status set to REJETE.',
    type: CompanyEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only admins can perform this action.',
    type: ForbiddenErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No company exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  rejectCompany(@Param('id') id: string) {
    return this.adminService.rejectCompany(id);
  }

  @Patch('companies/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspend a company',
    description: 'Sets the validationStatus of the target company to SUSPENDU.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Company identifier.' })
  @ApiOkResponse({
    description: 'Company validation status set to SUSPENDU.',
    type: CompanyEntity,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only admins can perform this action.',
    type: ForbiddenErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No company exists for the provided identifier.',
    type: NotFoundErrorResponseDto,
  })
  suspendCompany(@Param('id') id: string) {
    return this.adminService.suspendCompany(id);
  }
}
