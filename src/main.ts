import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Parse cookies so we can read the refresh_token HttpOnly cookie
  app.use(cookieParser());

  // Validate & strip unknown properties from all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip properties not in the DTO
      forbidNonWhitelisted: true, // throw if unknown properties are sent
    }),
  );

// src/
// ├── database/
// │   ├── data-source.ts
// │   ├── migrations/
// │   ├── seeds/
// │   ├── factories/
// │   └── subscribers/
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
