import { ApiProperty } from '@nestjs/swagger';
import { KybStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';


export class KybChecklistItemDto {
  @ApiProperty({
    example: 'siret',
    description: 'Unique machine-readable key for this checklist criterion.',
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    example: 'Numéro SIRET',
    description: 'Human-readable label displayed in the admin interface.',
  })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({
    example: true,
    description: 'Whether this criterion has been verified by the admin.',
  })
  @IsBoolean()
  verified!: boolean;
}


export class KybVerifyDto {
  @ApiProperty({
    enum: KybStatus,
    example: KybStatus.VALIDE,
    description:
      'Overall KYB decision set by the admin: EN_ATTENTE | VALIDE | REJETE.',
  })
  @IsEnum(KybStatus)
  status!: KybStatus;

  @ApiProperty({
    type: [KybChecklistItemDto],
    description:
      'List of verification criteria. kybScore is derived automatically ' +
      'as (verifiedCount / totalCount) * 100.',
    example: [
      { key: 'siret', label: 'Numéro SIRET', verified: true },
      {
        key: 'immatriculation_consulaire',
        label: 'Immatriculation consulaire',
        verified: true,
      },
      {
        key: 'certification_iso',
        label: 'Certification ISO',
        verified: false,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KybChecklistItemDto)
  checklistItems!: KybChecklistItemDto[];
}
