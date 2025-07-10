import { IRepository } from "@app/database/repository.interface";
import { Order, Prisma } from "@prisma/client";
import { OrderStatus } from "../dto/order-status.enum";

export interface IOrderRepository extends IRepository<Order> {
  createOrder(memberId: number, totalSales: number, status: OrderStatus, tx?: Prisma.TransactionClient): Promise<Order>;
  cancelOrder(orderId: number, tx?: Prisma.TransactionClient): Promise<Order>;
  getOrder(orderId: number, tx?: Prisma.TransactionClient);
}

export const IORDER_REPOSITORY = Symbol("IORDER_REPOSITORY");
