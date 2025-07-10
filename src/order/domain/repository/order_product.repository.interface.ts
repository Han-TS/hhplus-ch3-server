import { IRepository } from "@app/database/repository.interface";
import { Order_Product, Prisma } from "@prisma/client";

export interface IOrderProductRepository extends IRepository<Order_Product> {
  createOrderProduct(orderId: number, productId: number, amount: number, tx?: Prisma.TransactionClient): Promise<Order_Product>;
}

export const IORDER_PRODUCT_REPOSITORY = Symbol("IORDER_PRODUCT_REPOSITORY");
