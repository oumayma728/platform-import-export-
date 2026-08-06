import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function assertPostgresConnectionString(connectionString: string): void {
  let protocol: string;

  try {
    protocol = new URL(connectionString).protocol;
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (protocol !== 'postgresql:' && protocol !== 'postgres:') {
    throw new Error(
      'DATABASE_URL must use a PostgreSQL connection string (postgresql://...). Do not use a Supabase REST API URL.',
    );
  }
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL is not defined. Set it in the .env file at the project root.',
      );
    }

    assertPostgresConnectionString(connectionString);

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
