import { IRepository } from "@app/database/repository.interface";
import { Prisma, Product } from "@prisma/client";

export interface IProductRepository extends IRepository<Product> {
  findByIdWithPessimisticLock(id: number, tx: Prisma.TransactionClient): Promise<Product>;
  updateStock(id: number, stock: number, tx?: Prisma.TransactionClient): Promise<Product>;
}

export const IPRODUCT_REPOSITORY = Symbol("IPRODUCT_REPOSITORY");
