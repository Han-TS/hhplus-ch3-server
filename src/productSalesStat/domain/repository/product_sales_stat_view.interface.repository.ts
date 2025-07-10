import { IRepository } from "@app/database/repository.interface";
import { Prisma, Product_Sales_Stat_View } from "@prisma/client";

export interface IProductSalesStatViewRepository extends IRepository<Product_Sales_Stat_View> {
  getTop5ProductByAmountLast3Days(tx?: Prisma.TransactionClient): Promise<
    { rank: number; productId: number; productName: string; amount: number; sales: number }[]
  >;
}

export const IPRODUCT_SALES_STAT_VIEW_REPOSITORY = Symbol("IPRODUCT_SALES_STAT_VIEW_REPOSITORY");
