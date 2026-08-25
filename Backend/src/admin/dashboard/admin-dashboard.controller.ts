import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards,  ParseUUIDPipe } from '@nestjs/common';
import { ModerationActionType, ModerationEntityType, UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AccessTokenGuard } from '../../auth/guard/access-token.guard';
import { RolesGuard } from '../../auth/guard/roles.guard';
import {
  ConflictErrorResponseDto,
  ForbiddenErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
} from '../../common/dto/api-error-response.dto';
import { CompaniesService } from '../../companies/companies.service';
import { SuspendUserDto } from '../../users/dto/suspend-user.dto';
import { UsersService } from '../../users/users.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { ModerationHistoryService } from '../moderation-history/moderation-history.service';

import {
  AdminCompaniesResponseDto,
  AdminCompanyDocumentsResponseDto,
  AdminPendingCompaniesResponseDto,
  AdminUsersResponseDto,
  CompanyBadgeResponseDto,
  CompanyReputationScoreResponseDto,
  CompanyValidationResponseDto,
  KybVerifyResponseDto,
  SuspendUserResponseDto,
} from './dto/admin-dashboard-response.dto';
import { KybVerifyDto } from './dto/kyb-verify.dto';
import {
  RejectCompanyDto,
  ValidateCompanyDto,
} from './dto/company-validation.dto';
import { CreateCompanyBadgeDto } from './dto/create-company-badge.dto';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';
import { ValidationStatus } from '@prisma/client';

@ApiTags('Admin – Dashboard')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminDashboardController {
  constructor(
    private readonly adminDashboardService: AdminDashboardService,
    private readonly companiesService: CompaniesService,
    private readonly usersService: UsersService,
    private readonly moderationHistoryService: ModerationHistoryService,
  ) {}


  @ApiOperation({
    summary: 'Admin — list users',
    description:
      'Returns a paginated, filtered list of registered users. ' +
      'Supports filtering by status, country (via company relation), ' +
      'sector (via company relation), and registration date range. ' +
      'Also returns global status counters for dashboard badge indicators.',
  })
  @ApiQuery({ name: 'status', enum: ValidationStatus, required: false, description: 'Filter by user status.' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by company country.' })
  @ApiQuery({ name: 'sector', required: false, description: 'Filter by company sector.' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Include users registered on or after this ISO date.' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Include users registered on or before this ISO date.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1).' })
  @ApiQuery({ name: 'limit', required: false, description: 'Records per page (default: 10).' })
  @ApiOkResponse({
    description: 'Paginated user list returned successfully.',
    type: AdminUsersResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Get('users')
  async getUsers(
    @Query() filters: DashboardFiltersDto,
  ): Promise<AdminUsersResponseDto> {
    return this.adminDashboardService.getUsers(filters);
  }

  @ApiOperation({
    summary: 'Admin — list companies',
    description:
      'Returns a paginated, filtered list of companies. ' +
      'Supports filtering by status (via users relation), country, sector, ' +
      'and registration date range. ' +
      'Also includes the count of ACTIVE listings per company.',
  })
  @ApiQuery({ name: 'status', enum: ValidationStatus, required: false, description: 'Filter companies by status.' })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by company country.' })
  @ApiQuery({ name: 'sector', required: false, description: 'Filter by company sector.' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Include companies registered on or after this ISO date.' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Include companies registered on or before this ISO date.' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1).' })
  @ApiQuery({ name: 'limit', required: false, description: 'Records per page (default: 10).' })
  @ApiOkResponse({
    description: 'Paginated company list returned successfully.',
    type: AdminCompaniesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Get('companies')
  async getCompanies(
    @Query() filters: DashboardFiltersDto,
  ): Promise<AdminCompaniesResponseDto> {
    return this.adminDashboardService.getCompanies(filters);
  }

  @ApiOperation({
    summary: 'Admin — companies pending validation',
    description:
      'Returns a paginated list of companies that have at least one user ' +
      'with status EN_ATTENTE_VALIDATION, sorted by registration date descending. ' +
      '(The Company model has no status field; pending state is derived from its users.)',
  })
  @ApiOkResponse({
    description: 'Paginated list of pending companies returned successfully.',
    type: AdminPendingCompaniesResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Get('companies/pending')
  async getPendingCompanies(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<AdminPendingCompaniesResponseDto> {
    return this.companiesService.findPending(Number(page), Number(limit));
  }

  
  @ApiOperation({
    summary: 'Admin — company documents',
    description:
      'Returns the list of documents submitted by the company at registration. ' +
      'Documents are read from the certificationDocs JSON field. ' +
      'Each document exposes a previewUrl (inline display) and a downloadUrl.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Company identifier (UUID).',
  })
  @ApiOkResponse({
    description: 'Document list returned successfully.',
    type: AdminCompanyDocumentsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Company not found.' })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Get('companies/:id/documents')
  async getCompanyDocuments(
    @Param('id') id: string,
  ): Promise<AdminCompanyDocumentsResponseDto> {
    return this.companiesService.getDocuments(id);
  }

  
  @ApiOperation({
    summary: 'Admin — suspend a user account',
    description:
      'Sets the user status to SUSPENDU, revokes all active sessions immediately, ' +
      'and records the action in user_moderation_history for full traceability. ' +
      'A suspended user cannot log in or create listings. ' +
      'The adminId is always extracted from the authenticated JWT — never from the request body.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of the user to suspend (UUID).',
  })
  @ApiBody({ type: SuspendUserDto })
  @ApiOkResponse({
    description: 'User suspended successfully.',
    type: SuspendUserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    type: NotFoundErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'User is already suspended.',
    type: ConflictErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() admin: { id: string },
  ): Promise<SuspendUserResponseDto> {
    const user = await this.usersService.suspend({
      userId,
      adminId: admin.id,
      motif: dto.motif,
      suspensionDurationDays: dto.suspensionDurationDays,
    });

    await this.moderationHistoryService.createModerationHistory({
      entityType: ModerationEntityType.USER,
      entityId: userId,
      actionType: ModerationActionType.SUSPENSION,
      adminId: admin.id,
      details: {
        reason: dto.motif || 'Compte suspendu',
        suspensionDurationDays: dto.suspensionDurationDays ?? null,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      updatedAt: user.updatedAt,
      message: 'Account suspended successfully',
    };
  }

  
  @ApiOperation({
    summary: 'Admin — KYB verification',
    description:
      'Saves or updates the Know Your Business verification result for a company. ' +
      'The kybScore is automatically calculated as ' +
      '(verifiedItems / totalItems) * 100. ' +
      'verifiedAt is always set server-side to the current timestamp. ' +
      'Calling this endpoint multiple times is idempotent (upsert).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Company identifier (UUID).',
  })
  @ApiBody({ type: KybVerifyDto })
  @ApiOkResponse({
    description: 'KYB verification saved successfully.',
    type: KybVerifyResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company not found.',
    type: NotFoundErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Post('companies/:id/kyb-verify')
  @HttpCode(HttpStatus.OK)
  async kybVerify(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: KybVerifyDto,
    @CurrentUser() admin: { id: string },
  ): Promise<KybVerifyResponseDto> {
     return this.companiesService.verifyKyb(companyId, admin.id, dto);
  }


  @ApiOperation({
    summary: 'Admin — validate a company inscription',
    description:
      'Sets company status from EN_ATTENTE_VALIDATION to VALIDE. ' +
      'Records the decision with admin identity and optional motif in ' +
      'company_validation_history. ' +
      'Returns 409 if the company is already VALIDE or REJETE.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Company identifier (UUID).',
  })
  @ApiBody({ type: ValidateCompanyDto })
  @ApiOkResponse({
    description: 'Company validated successfully.',
    type: CompanyValidationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company not found.',
    type: NotFoundErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Company is already VALIDE or REJETE.',
    type: ConflictErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Post('companies/:id/validate')
  @HttpCode(HttpStatus.OK)
  async validateCompany(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: ValidateCompanyDto,
    @CurrentUser() admin: { id: string },
  ): Promise<CompanyValidationResponseDto> {
    const company = await this.companiesService.validate({
      companyId,
      adminId: admin.id,
      motif: dto.motif,
    });

    return {
      id: company.id,
      name: company.name,
      status: company.status,
      updatedAt: company.updatedAt,
      message: 'Company validated successfully',
    };
  }


  @ApiOperation({
    summary: 'Admin — reject a company inscription',
    description:
      'Sets company status from EN_ATTENTE_VALIDATION to REJETE. ' +
      'Records the decision with admin identity and optional motif in ' +
      'company_validation_history. ' +
      'Returns 409 if the company is already VALIDE or REJETE.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Company identifier (UUID).',
  })
  @ApiBody({ type: RejectCompanyDto })
  @ApiOkResponse({
    description: 'Company rejected successfully.',
    type: CompanyValidationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company not found.',
    type: NotFoundErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Company is already VALIDE or REJETE.',
    type: ConflictErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Post('companies/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectCompany(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: RejectCompanyDto,
    @CurrentUser() admin: { id: string },
  ): Promise<CompanyValidationResponseDto> {
    const company = await this.companiesService.reject({
      companyId,
      adminId: admin.id,
      motif: dto.motif,
    });

    return {
      id: company.id,
      name: company.name,
      status: company.status,
      updatedAt: company.updatedAt,
      message: 'Company rejected successfully',
    };
  }


  
  @ApiOperation({
    summary: 'Admin — assign a badge to a company',
    description:
      'Creates a CompanyBadge record linking the badge type to the company. ' +
      'The awardedBy field is always taken from the authenticated JWT, ' +
      'never from the request body. ' +
      'Returns 404 if the company does not exist.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Company identifier (UUID).',
  })
  @ApiBody({ type: CreateCompanyBadgeDto })
  @ApiOkResponse({
    description: 'Badge assigned successfully.',
    type: CompanyBadgeResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company not found.',
    type: NotFoundErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Post('companies/:id/badges')
  @HttpCode(HttpStatus.OK)
  async assignBadge(
    @Param('id', ParseUUIDPipe) companyId: string,
    @Body() dto: CreateCompanyBadgeDto,
    @CurrentUser() admin: { id: string },
  ): Promise<CompanyBadgeResponseDto> {
    return this.companiesService.assignBadge({
      companyId,
      badgeType: dto.badgeType,
      awardedBy: admin.id,
    });
  }

  // ─── Reputation Score ──────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Admin — company reputation score',
    description:
      'Returns the full reputation/reliability score for a given company. ' +
      'The score aggregates KYB result, average review rating, assigned badges, ' +
      'and negative moderation events (malus). ' +
      'Intended for consumption by the AI Matching Agent (Stagiaire 3). ' +
      'Protected — ADMIN role required.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID of the company to score.',
  })
  @ApiOkResponse({
    description: 'Reputation score returned successfully.',
    type: CompanyReputationScoreResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Company not found.',
    type: NotFoundErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Get('companies/:id/reputation-score')
  async getReputationScore(
    @Param('id', ParseUUIDPipe) companyId: string,
  ): Promise<CompanyReputationScoreResponseDto> {
    return this.companiesService.getReputationScore(companyId);
  }
}

