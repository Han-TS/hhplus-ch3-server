import { IEventConsumer } from "@app/kafka/event-consumer.interface";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { NotifyService } from "../domain/service/notify.service";
import { KafkaEventConsumer } from "@app/kafka/kafka-event-consumer";
import { PayCompletedEvent } from "@app/common/events/pay-completed.event";
import { SendOrderInfoCommand } from "../domain/dto/send-order-info.command";

@Injectable()
export class NotifyPayCompletedConsumer implements IEventConsumer, OnModuleInit {
  constructor(
    private readonly notifyService: NotifyService,
    private readonly kafkaConsumer: KafkaEventConsumer
  ) {}

  getTopic(): string {
    return 'pay.completed';
  }

  getGroupId(): string {
    return 'notify-service';
  }

  async handleMessage(message: PayCompletedEvent): Promise<void> {
    const command: SendOrderInfoCommand = message.order;

    await this.notifyService.sendOrderInfoToExtPlatform(command);
  }

  async onModuleInit() {
    await this.kafkaConsumer.register(this);
  }
}