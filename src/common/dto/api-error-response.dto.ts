import { ApiProperty } from '@nestjs/swagger';

/*
  This File Helps In Swagger Documentation
*/

export class ValidationErrorResponseDto {
  @ApiProperty({
    type: [String],
    example: [
      'property unexpectedField should not exist',
      'email must be an email',
    ],
    description:
      'Validation error messages returned by the global ValidationPipe.',
  })
  message!: string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiProperty({ example: 400 })
  statusCode!: number;
}

export class UnauthorizedErrorResponseDto {
  @ApiProperty({ example: 'Unauthorized' })
  message!: string;

  @ApiProperty({ example: 'Unauthorized' })
  error!: string;

  @ApiProperty({ example: 401 })
  statusCode!: number;
}

export class ForbiddenErrorResponseDto {
  @ApiProperty({ example: 'Only admins can perform this action' })
  message!: string;

  @ApiProperty({ example: 'Forbidden' })
  error!: string;

  @ApiProperty({ example: 403 })
  statusCode!: number;
}

export class NotFoundErrorResponseDto {
  @ApiProperty({ example: 'Resource not found' })
  message!: string;

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({ example: 404 })
  statusCode!: number;
}

export class ConflictErrorResponseDto {
  @ApiProperty({ example: 'Resource already exists' })
  message!: string;

  @ApiProperty({ example: 'Conflict' })
  error!: string;

  @ApiProperty({ example: 409 })
  statusCode!: number;
}
