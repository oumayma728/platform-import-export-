import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ModerationEntityType, UserRole } from '@prisma/client';

import { Roles } from '../../auth/decorators/roles.decorator';
import { AccessTokenGuard } from '../../auth/guard/access-token.guard';
import { RolesGuard } from '../../auth/guard/roles.guard';
import {
  ForbiddenErrorResponseDto,
  UnauthorizedErrorResponseDto,
} from '../../common/dto/api-error-response.dto';
import { ModerationHistoryListResponseDto } from './dto/moderation-history-response.dto';
import { ModerationHistoryService } from './moderation-history.service';

@ApiTags('Admin – Moderation History')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/moderation-history')
export class ModerationHistoryController {
  constructor(
    private readonly moderationHistoryService: ModerationHistoryService,
  ) {}

 
  @ApiOperation({
    summary: 'Admin — list moderation history',
    description:
      'Returns a paginated list of moderation actions filtered by entity type and entity ID. ' +
      'Results are sorted by timestamp descending (most recent first). ' +
      'Covers all action types: VALIDATION, REJECTION, SUSPENSION, KYB_VERIFICATION, BADGE_ASSIGNED.',
  })
  @ApiQuery({
    name: 'entity_type',
    enum: ModerationEntityType,
    required: true,
    description: 'Type of the entity: COMPANY or USER.',
  })
  @ApiQuery({
    name: 'entity_id',
    type: String,
    required: true,
    description: 'UUID of the entity (company or user) to query history for.',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number (1-indexed). Defaults to 1.',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Number of records per page. Defaults to 10.',
  })
  @ApiOkResponse({
    description: 'Paginated moderation history returned successfully.',
    type: ModerationHistoryListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Access token is missing or invalid.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'The authenticated user does not have the ADMIN role.',
    type: ForbiddenErrorResponseDto,
  })
  @Get()
  async getModerationHistory(
    @Query('entity_type') entityType: ModerationEntityType,
    @Query('entity_id', ParseUUIDPipe) entityId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<ModerationHistoryListResponseDto> {
    return this.moderationHistoryService.getModerationHistory(
      entityType,
      entityId,
      page,
      limit,
    );
  }
}
