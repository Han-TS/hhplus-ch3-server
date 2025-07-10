import { PrismaService } from "@app/database/prisma/prisma.service";
import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { IRepository } from "@app/database/repository.interface";
import { Injectable } from "@nestjs/common";
import { Order_Product, Prisma } from "@prisma/client";
import { IOrderProductRepository } from "../domain/repository/order_product.repository.interface";

@Injectable()
export class OrderProductRepository extends PrismaRepository<Order_Product> implements IOrderProductRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.order_Product);
  }

  async createOrderProduct(orderId: number, productId: number, amount: number, tx?: Prisma.TransactionClient): Promise<Order_Product> {
    const client = tx ?? this.prisma;

    return await client.order_Product.create({
      data: {
        order: { connect: { id: orderId } },
        product: { connect: { id: productId } },
        amount,
      },
    });
  }
}
