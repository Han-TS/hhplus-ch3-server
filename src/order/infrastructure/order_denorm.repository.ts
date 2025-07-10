import { PrismaService } from "@app/database/prisma/prisma.service";
import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { Injectable } from "@nestjs/common";
import { Order_Denorm, Prisma } from "@prisma/client";
import { IOrderDenormRepository } from "../domain/repository/order_denorm.repository.interface";

@Injectable()
export class OrderDenormRepository extends PrismaRepository<Order_Denorm> implements IOrderDenormRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.order_Denorm);
  }

  async getOrder(orderId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.order_Denorm.findMany({
      where: { orderId: orderId },
    });
  }
}
