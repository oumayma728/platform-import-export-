import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyEntity {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id!: string;

  @ApiProperty({ example: 'Acme Export' })
  name!: string;

  @ApiProperty({ example: true })
  isExporter!: boolean;

  @ApiProperty({ example: false })
  isImporter!: boolean;

  @ApiProperty({ example: 'Tunisia' })
  country!: string;

  @ApiPropertyOptional({
    example: 'Leading exporter of industrial goods.',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com',
    nullable: true,
  })
  website!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    example: 'RC123456',
    nullable: true,
  })
  registrationNumber!: string | null;

  @ApiPropertyOptional({
    type: Object,
    example: { iso9001: true, fileUrl: 'https://example.com/cert.pdf' },
    nullable: true,
  })
  certificationDocs!: Record<string, unknown> | null;

  @ApiProperty({
    example: '2026-07-15T10:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-07-15T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}
