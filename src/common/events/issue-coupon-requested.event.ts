import { IEvent } from "@nestjs/cqrs";

export class IssueCouponRequstedEvent implements IEvent{
  constructor (
    public readonly outboxId: number,
    public readonly couponId: number,
    public readonly memberId: number,
  ) {}
}