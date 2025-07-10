import { IssueCouponRequstedEvent } from "@app/common/events/issue-coupon-requested.event";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { KafkaEventPublisherService } from "@app/kafka/kafka-event-publisher.service";
import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { subMinutes } from "date-fns";

@Injectable()
export class OutboxRetryPublisher {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly kafkaPublisher: KafkaEventPublisherService,
  ) {}

  @Interval(5000)
  async retryUnpublishedMessages() {
    const fiveMinutesAgo = subMinutes(new Date(), 5);

    await this.transactionService.executeInTransaction(async (tx) => {
      const client = tx;

      const outboxEvents = await client.outbox.findMany({
        where: {
          status: 'init',
          createdAt: { lte: fiveMinutesAgo },
        },
        take: 10,
        orderBy: { createdAt: 'asc' },
      });

      for (const event of outboxEvents) {
        try {
          let eventObject: any;
          const parsedValue = typeof event.value === 'string'
            ? JSON.parse(event.value)
            : event.value;

          switch (event.topic) {
            case 'issue.coupon.requested':
              eventObject = new IssueCouponRequstedEvent(event.id, parsedValue.couponId, parsedValue.memberId);
              break;

            default:
              eventObject = { outboxId: event.id, ...parsedValue };
          }

          await this.kafkaPublisher.publish({
            topic: event.topic,
            key: event.key,
            value: JSON.stringify(eventObject),
          });
        } catch (error) {
          console.error(`재발행 실패 (id: ${event.id}):`, error)
        }
      }
    });
  }
}