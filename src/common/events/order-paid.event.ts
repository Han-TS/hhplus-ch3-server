import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { PayCompletedEvent } from "@app/common/events/pay-completed.event";
import { OrderPaidEvent } from "@app/common/events/order-paid.event";
import { SendOrderInfoToExtPlatformUsecase } from "../send-order-info-to-ext-platform.usecase";

@Injectable()
@EventsHandler(PayCompletedEvent)
export class OrderEventListener implements IEventHandler<PayCompletedEvent | OrderPaidEvent> {
  constructor(private readonly sendOrderInfoToExtPlatformUsecase: SendOrderInfoToExtPlatformUsecase) {}

  // 1. Kafka 기반 이벤트 수신 (기존)
  @OnEvent("pay.completed")
  handlePayCompletedEvent(event: PayCompletedEvent) {
    const order = event.order;
    this.sendOrderInfoToExtPlatformUsecase.send(order);
  }

  // 2. Application 기반 이벤트 수신 (신규)
  @OnEvent("order.paid")
  handleOrderPaidEvent(event: OrderPaidEvent) {
    const { orderId, memberId } = event;
    this.sendOrderInfoToExtPlatformUsecase.sendByOrderId(orderId, memberId);
  }

  // 3. CQRS 이벤트 핸들러 (필요 시)
  handle(event: PayCompletedEvent | OrderPaidEvent) {
    if ("order" in event) {
      this.sendOrderInfoToExtPlatformUsecase.send(event.order);
    } else {
      this.sendOrderInfoToExtPlatformUsecase.sendByOrderId(event.orderId, event.memberId);
    }
  }
}
