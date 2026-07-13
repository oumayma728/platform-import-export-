import { createServer } from 'net';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';


// TODO : return tihs file to be simple (delete this func) and requestedPort, port variables, availablePort
async function findAvailablePort(startPort: number, maxTries = 20): Promise<number> {
  for (let port = startPort; port < startPort + maxTries; port += 1) {
    const tester = createServer();

    try {
      await new Promise<void>((resolve, reject) => {
        tester.once('error', reject);
        tester.listen(port, '0.0.0.0', () => {
          tester.close(() => resolve());
        });
      });

      return port;
    } catch (error: any) {
      if (error?.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error(`Unable to find an available port starting from ${startPort}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Users, Auth and List API')
    .setDescription('Auth and Client CRUD API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer("http://localhost:3000")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Parse cookies so we can read the refresh_token HttpOnly cookie
  app.use(cookieParser());

  // Validate & strip unknown properties from all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strip properties not in the DTO
      forbidNonWhitelisted: true, // throw if unknown properties are sent
      transform: true,
    }),
  );

  const requestedPort = Number(process.env.PORT) || 3000;
  const port = Number.isNaN(requestedPort) ? 3000 : requestedPort;
  const availablePort = await findAvailablePort(port);

  await app.listen(availablePort, '0.0.0.0', () => {
    console.log(`Application is running on: http://localhost:${availablePort}`);
  });
}
bootstrap();
