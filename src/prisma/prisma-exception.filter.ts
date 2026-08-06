import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

const DATABASE_UNAVAILABLE_CODES = new Set([
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'P1001',
  'P1002',
  'P1017',
]);

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter<Prisma.PrismaClientKnownRequestError> {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = DATABASE_UNAVAILABLE_CODES.has(exception.code)
      ? HttpStatus.SERVICE_UNAVAILABLE
      : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `Prisma request failed with code ${exception.code}: ${exception.message}`,
    );

    response.status(statusCode).json({
      statusCode,
      message:
        statusCode === HttpStatus.SERVICE_UNAVAILABLE
          ? 'Database is temporarily unavailable. Please try again shortly.'
          : 'A database error occurred.',
      error:
        statusCode === HttpStatus.SERVICE_UNAVAILABLE
          ? 'Service Unavailable'
          : 'Internal Server Error',
    });
  }
}
