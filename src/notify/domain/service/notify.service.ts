import { Injectable } from "@nestjs/common";
import { SendOrderInfoCommand } from "../dto/send-order-info.command";

@Injectable()
export class NotifyService {
  constructor() {}

  async sendOrderInfoToExtPlatform(command: SendOrderInfoCommand): Promise<void> {
    const order = command;
    console.log(`order 정보를 외부 시스템에 전송함 orderId: ${order.id}`);
  }
}
