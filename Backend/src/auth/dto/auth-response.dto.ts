import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken!: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logged out',
    description: 'Logout confirmation message',
  })
  message!: string;
}
