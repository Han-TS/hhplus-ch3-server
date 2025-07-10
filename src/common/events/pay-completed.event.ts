import { IEvent } from "@nestjs/cqrs";
import { Order } from "@prisma/client";

export class PayCompletedEvent implements IEvent{
  constructor (
    public readonly order: Order
  ) {}
}