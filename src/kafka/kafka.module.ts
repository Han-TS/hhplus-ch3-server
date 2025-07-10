import { Module } from "@nestjs/common";
import { KafkaEventPublisherService } from "./kafka-event-publisher.service";
import { KafkaEventConsumer } from "./kafka-event-consumer";

@Module({
  providers: [
    KafkaEventPublisherService,
    KafkaEventConsumer
  ],
  exports: [
    KafkaEventPublisherService,
    KafkaEventConsumer
  ]
})
export class KafkaModule {}