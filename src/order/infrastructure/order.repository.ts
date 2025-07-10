import { PrismaService } from "@app/database/prisma/prisma.service";
import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { Injectable } from "@nestjs/common";
import { Order, Prisma } from "@prisma/client";
import { OrderStatus } from "../domain/dto/order-status.enum";
import { IOrderRepository } from "../domain/repository/order.repository.interface";

@Injectable()
export class OrderRepository extends PrismaRepository<Order> implements IOrderRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.order);
  }

  async createOrder(memberId: number, totalSales: number, status: OrderStatus, tx?: Prisma.TransactionClient): Promise<Order> {
    const client = tx ?? this.prisma;

    return await client.order.create({
      data: {
        memberId,
        totalSales,
        status,
      },
    });
  }

  async paymentCompleteOrder(orderId, tx?: Prisma.TransactionClient): Promise<Order> {
    const client = tx ?? this.prisma;

    return await this.updateById(orderId, { status: OrderStatus.PAYMENT_COMPLETED }, client);
  }

  async cancelOrder(orderId: number, tx?: Prisma.TransactionClient): Promise<Order> {
    const client = tx ?? this.prisma;
    
    return await this.updateById(orderId, { status: OrderStatus.ORDER_CANCEL }, client);
  }

  async getOrder(orderId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.order.findUnique({
      where: { id: orderId },
      include: {
        orderProducts: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}
