import { IRepository } from "@app/database/repository.interface";
import { Order_Denorm, Prisma } from "@prisma/client";

export interface IOrderDenormRepository extends IRepository<Order_Denorm> {
  getOrder(orderId: number, tx?: Prisma.TransactionClient);
}

export const IORDER_DENORM_REPOSITORY = Symbol("IORDER_DENORM_REPOSITORY");
