import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendTestEmailDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Target email address',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    example: 'Test Notification',
    description: 'Email subject',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: 'This is a test notification message.',
    description: 'Email body text',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({
    example: '<p>This is a <b>test</b> notification message.</p>',
    description: 'Optional HTML email body',
  })
  @IsOptional()
  @IsString()
  html?: string;
}
