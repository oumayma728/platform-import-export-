import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';


export class SuspendUserDto {
  @ApiProperty({
    example: 'Fraude détectée lors de la transaction #456',
    description: 'Reason for the suspension.',
  })
  @IsString()
  motif!: string;

  @ApiProperty({
    example: 30,
    description: 'Suspension duration in days.',
  })
  @IsInt()
  @Min(1)
  suspensionDurationDays!: number;
}