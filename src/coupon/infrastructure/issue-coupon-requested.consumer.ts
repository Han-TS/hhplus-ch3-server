import { IEventConsumer } from "@app/kafka/event-consumer.interface";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { CouponRedisService } from "../domain/service/coupon.redis.service";
import { KafkaEventConsumer } from "@app/kafka/kafka-event-consumer";
import { IssueCouponRequstedEvent } from "@app/common/events/issue-coupon-requested.event";

@Injectable()
export class IssueCouponRequestedConsumer implements IEventConsumer, OnModuleInit {
  constructor(
    private readonly conponRedisService: CouponRedisService,
    private readonly kafkaConsumer: KafkaEventConsumer,
  ) {}

  getTopic(): string {
    return 'issue.coupon.requested';
  }

  getGroupId(): string {
    return 'coupon-service';
  }

  async handleMessage(message: IssueCouponRequstedEvent): Promise<void> {
    const outboxId: number = message.outboxId;
    const couponId: number = message.couponId;
    const memberId: number = message.memberId;

    await this.conponRedisService.processIssueCoupon(outboxId, couponId, memberId);
  }

  async onModuleInit() {
    await this.kafkaConsumer.register(this);
  }
}