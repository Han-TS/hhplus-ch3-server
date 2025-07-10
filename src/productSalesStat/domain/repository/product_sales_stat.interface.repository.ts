import { IRepository } from "@app/database/repository.interface";
import { Prisma, Product_Sales_Stat } from "@prisma/client";

export interface IProductSalesStatRepository extends IRepository<Product_Sales_Stat> {
  findStatWithPessimisticLock(salesDate: Date, productId: number, tx: Prisma.TransactionClient): Promise<Product_Sales_Stat[]>;
  getTop5ProductByAmountLast3Days(tx?: Prisma.TransactionClient): Promise<
    { rank: number; productId: number; productName: string; amount: number; sales: number }[]
  >;
}

export const IPRODUCT_SALES_STAT_REPOSITORY = Symbol("IPRODUCT_SALES_STAT_REPOSITORY");
