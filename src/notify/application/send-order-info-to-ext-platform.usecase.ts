import { Injectable } from "@nestjs/common";
import { NotifyService } from "../domain/service/notify.service";
import { Order } from "@prisma/client";
import { SendOrderInfoCommand } from "../domain/dto/send-order-info.command";

@Injectable()
export class SendOrderInfoToExtPlatformUsecase {
  constructor(
    private readonly notifyService: NotifyService
  ) {}

  async send(order: Order): Promise<void> {
    const command: SendOrderInfoCommand = order;

    await this.notifyService.sendOrderInfoToExtPlatform(command);
  }
}