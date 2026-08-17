import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty} from 'class-validator';


export class ValidateCompanyDto {
  @ApiPropertyOptional({
    example: 'Documents vérifiés, numéro SIRET confirmé.',
    description: 'Optional reason for the validation decision.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  motif?: string;
}


export class RejectCompanyDto {
  @ApiPropertyOptional({
    example: 'Documents non conformes ou incomplets.',
    description: 'Optional reason for the rejection decision.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  motif?: string;
}
