import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationStatus } from '@prisma/client';

export class AdminCompanyDocumentDto {
  @ApiProperty({
    example: 'Registre de commerce',
    description: 'Human-readable name of the document.',
  })
  nom_document!: string;

  @ApiProperty({
    example: 'https://storage.example.com/preview/rc-123.pdf',
    description: 'URL to preview the document inline.',
  })
  previewUrl!: string;

  @ApiProperty({
    example: 'https://storage.example.com/download/rc-123.pdf',
    description: 'URL to download the document.',
  })
  downloadUrl!: string;

  @ApiProperty({
    example: '2026-07-15T10:00:00.000Z',
    description: 'ISO 8601 date-time when the document was uploaded.',
  })
  date_upload!: string;
}

export class AdminCompanyDocumentsResponseDto {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  companyId!: string;

  @ApiProperty({ example: 'Acme Export' })
  companyName!: string;

  @ApiProperty({
    type: [AdminCompanyDocumentDto],
    description: 'List of documents extracted from certificationDocs JSON.',
  })
  documents!: AdminCompanyDocumentDto[];

  @ApiProperty({
    example: 3,
    description: 'Total number of documents found.',
  })
  total!: number;
}




export class AdminUserRowDto {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: '+21612345678' })
  phone!: string;

  @ApiProperty({
    enum: ValidationStatus,
    example: ValidationStatus.EN_ATTENTE_VALIDATION,
  })
  status!: ValidationStatus;

  @ApiProperty({
    example: '2026-07-15T10:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: Date;
}


export class AdminUserStatusCountsDto {
  @ApiProperty({ example: 12 })
  VALIDE!: number;

  @ApiProperty({ example: 5 })
  EN_ATTENTE_VALIDATION!: number;

  @ApiProperty({ example: 2 })
  REJETE!: number;

  @ApiProperty({ example: 1 })
  SUSPENDU!: number;
}


export class AdminUsersResponseDto {
  @ApiProperty({ type: [AdminUserRowDto] })
  data!: AdminUserRowDto[];

  @ApiProperty()
  statusCounts!: AdminUserStatusCountsDto;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 20 })
  total!: number;
}


export class AdminCompanyRowDto {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id!: string;

  @ApiProperty({ example: 'Acme Export' })
  name!: string;

  @ApiProperty({ example: 'Morocco' })
  country!: string;

  @ApiProperty({
    example: 'Export of agricultural products',
  })
  description!: string;

  @ApiProperty({
    example: 5,
    description: 'Number of active listings',
  })
  activeListings!: number;

  @ApiProperty({
    example: '2026-07-15T10:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: Date;
}

export class AdminCompaniesResponseDto {
  @ApiProperty({ type: [AdminCompanyRowDto] })
  data!: AdminCompanyRowDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 15, description: 'Total number of companies' })
  total!: number;
}



export class AdminPendingCompanyRowDto {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id!: string;

  @ApiProperty({ example: 'Acme Export' })
  name!: string;

  @ApiProperty({ example: 'Tunisia' })
  country!: string;

  @ApiProperty({ example: 'Leading exporter of industrial goods.' })
  description!: string;

  @ApiProperty({ example: '2026-07-15T10:00:00.000Z', format: 'date-time' })
  createdAt!: Date;
}

export class AdminPendingCompaniesResponseDto {
  @ApiProperty({ type: [AdminPendingCompanyRowDto] })
  data!: AdminPendingCompanyRowDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({
    example: 7,
    description: 'Total number of companies pending validation.',
  })
  total!: number;
}




export class SuspendUserResponseDto {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({
    example: 'SUSPENDU',
    description: 'Updated user status after suspension.',
  })
  status!: string;

  @ApiProperty({ example: '2026-07-15T10:00:00.000Z', format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({
    example: 'Account suspended successfully',
    description: 'Confirmation message.',
  })
  message!: string;
}




export class KybVerifyResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({ example: 'a1b2c3d4-...' })
  companyId!: string;

  @ApiProperty({
    example: 'VALIDE',
    description: 'KYB status set by the admin (EN_ATTENTE | VALIDE | REJETE).',
  })
  status!: string;

  @ApiProperty({
    example: 66.67,
    description:
      'Score automatically calculated as (verifiedItems / totalItems) * 100, ' +
      'rounded to 2 decimal places.',
  })
  kybScore!: number;

  @ApiProperty({
    example: '2026-08-07T04:00:00.000Z',
    format: 'date-time',
    description: 'Timestamp set automatically when the verification is saved.',
  })
  verifiedAt: Date | null;

  @ApiProperty({
    type: Array,
    description: 'Checklist items as submitted by the admin.',
  })
  checklistItems!: unknown;
}




export class CompanyValidationResponseDto {
  @ApiProperty({
    example: '3203f19e-e763-426b-9c24-b14316d84878',
  })
  id!: string;

  @ApiProperty({
    example: 'Acme Export',
  })
  name!: string;

  @ApiProperty({
    enum: ValidationStatus,
    example: ValidationStatus.VALIDE,
    description: 'Updated company validation status after the admin decision.',
  })
  status!: ValidationStatus;

  @ApiProperty({
    example: '2026-08-08T01:20:00.000Z',
    format: 'date-time',
  })
  updatedAt!: Date;

  @ApiProperty({
    example: 'Company validated successfully',
  })
  message!: string;
}


export class CompanyBadgeResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id!: string;

  @ApiProperty({ example: '3203f19e-...' })
  companyId!: string;

  @ApiProperty({ example: 'ENTREPRISE_VERIFIEE' })
  badgeType!: string;

  @ApiProperty({ example: 'admin-uuid-...' })
  awardedBy!: string;

  @ApiProperty({ example: '2026-08-08T14:00:00.000Z', format: 'date-time' })
  awardedAt!: Date;
}


export class ReviewsSummaryResponseDto {
  @ApiProperty({
    example: '3203f19e-...',
    description: 'Company identifier.',
  })
  companyId!: string;

  @ApiProperty({
    example: 4.3,
    description: 'Average rating across all reviews. Null if no reviews.',
    nullable: true,
  })
  averageRating!: number | null;

  @ApiProperty({
    example: 17,
    description: 'Total number of reviews for this company.',
  })
  reviewCount!: number;
}

// ─── Reputation Score ─────────────────────────────────────────────────────────

export class CompanyReputationScoreResponseDto {
  @ApiProperty({
    example: '3203f19e-e763-426b-9c24-b14316d84878',
    description: 'UUID of the company.',
  })
  company_id!: string;

  @ApiProperty({
    example: 75,
    description:
      'KYB score (0–100). Ratio of verified checklist items × 100. 0 if no KYB performed.',
  })
  kyb_score!: number;

  @ApiProperty({
    example: 4.3,
    nullable: true,
    description:
      'Average rating across all reviews (1–5). Null if no reviews yet.',
  })
  average_rating!: number | null;

  @ApiProperty({
    example: 17,
    description: 'Total number of reviews. Informational — not used in formula.',
  })
  review_count!: number;

  @ApiProperty({
    example: ['ENTREPRISE_VERIFIEE', 'TOP_EXPORTATEUR'],
    description:
      'List of badge types currently assigned to the company.',
    type: [String],
  })
  badges!: string[];

  @ApiProperty({
    example: 1,
    description:
      'Number of negative moderation events (REJECTION actions in moderation_history). Each malus subtracts 5 points from the final score.',
  })
  malus_count!: number;

  @ApiProperty({
    example: 68,
    description:
      'Final reputation score (0–100, integer). ' +
      'Formula: max(0, min(100, round(0.5*kyb_score + 0.3*rating_score + 0.2*badge_score - 5*malus_count))). ' +
      'rating_score = (average_rating/5)*100 (0 if no reviews). ' +
      'badge_score = min(badges.length*20, 100).',
  })
  final_reputation_score!: number;
}