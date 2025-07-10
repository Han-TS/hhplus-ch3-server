import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const runMode = process.env.RUN_MODE;
    const databaseUrl =
      runMode === 'test'
        ? process.env.TEST_DATABASE_URL
        : process.env.DATABASE_URL;

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      transactionOptions: {
        maxWait: 10000, // 클라이언트가 연결될 때까지 최대 기다리는 시간 (ms)
        timeout: 15000, // 트랜잭션 타임아웃 시간 (ms)
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
