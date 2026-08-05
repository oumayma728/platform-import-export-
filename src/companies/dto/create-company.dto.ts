import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Acme Export',
    description: 'Company name.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the company exports goods.',
  })
  @IsOptional()
  @IsBoolean()
  isExporter?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the company imports goods.',
  })
  @IsOptional()
  @IsBoolean()
  isImporter?: boolean;

  @ApiProperty({
    example: 'Tunisia',
    description: 'Company country.',
  })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({
    example: 'Leading exporter of industrial goods.',
    description: 'Company description.',
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Company website URL.',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    description: 'Company logo URL.',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'RC123456',
    description: 'Company registration number.',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    type: Object,
    example: { iso9001: true, fileUrl: 'https://example.com/cert.pdf' },
    description: 'Arbitrary certification metadata or documents.',
  })
  @IsOptional()
  certificationDocs?: Record<string, unknown>;
}
