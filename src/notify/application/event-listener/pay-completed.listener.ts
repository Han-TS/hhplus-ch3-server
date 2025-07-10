import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SendOrderInfoToExtPlatformUsecase } from "../send-order-info-to-ext-platform.usecase";
import { PayCompletedEvent } from "@app/common/events/pay-completed.event";
import { EventsHandler, IEventHandler } from "@nestjs/cqrs";

@Injectable()
@EventsHandler(PayCompletedEvent)
export class PayCompletedListener implements IEventHandler<PayCompletedEvent> {
  constructor(private readonly sendOrderInfoToExtPlatformUsecase: SendOrderInfoToExtPlatformUsecase) {}

  @OnEvent('pay.completed')
  handlePayCompletedEvent(event: PayCompletedEvent) {
    const order = event.order;

    this.sendOrderInfoToExtPlatformUsecase.send(order)
  }

  handle(event: PayCompletedEvent) {
    const order = event.order;

    this.sendOrderInfoToExtPlatformUsecase.send(order);
  }
}