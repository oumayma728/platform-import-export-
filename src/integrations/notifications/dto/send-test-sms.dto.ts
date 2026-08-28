import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsPhoneNumber } from 'class-validator';

export class SendTestSmsDto {
  @ApiProperty({
    example: '+14155552671',
    description: 'Target phone number in E.164 format',
  })
  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({
    example: 'Test SMS from Import-Export platform.',
    description: 'SMS text content',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
