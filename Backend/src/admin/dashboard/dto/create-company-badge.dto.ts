import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';


export class CreateCompanyBadgeDto {
  @ApiProperty({
    example: 'ENTREPRISE_VERIFIEE',
    description:
      'Badge type to assign. Common values: ENTREPRISE_VERIFIEE, ' +
      'CERTIFIEE, TOP_EXPORTATEUR, PARTENAIRE_PREMIUM.',
  })
  @IsString()
  @IsNotEmpty()
  badgeType!: string;
}
