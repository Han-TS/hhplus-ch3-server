import { PrismaModule } from "@app/database/prisma/prisma.module";
import { KafkaModule } from "@app/kafka/kafka.module";
import { Module } from "@nestjs/common";
import { OutboxRetryPublisher } from "./outbox.retry.publisher";

@Module({
  imports: [
    KafkaModule,
    PrismaModule
  ],
  controllers: [],
  providers: [
    OutboxRetryPublisher
  ],
  exports: []
})
export class OutboxModule {}