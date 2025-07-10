import { PaidProduct } from "../dto/add-product-sales-stat.command.dto";

export interface IProductSalesStatRedisRepository {
  recordSales(salesDate: Date, paidProduct: PaidProduct): Promise<boolean>;
  getTop5ProductByScore(): Promise<string>;
}

export const IPRODUCT_SALES_STAT_REDIS_REPOSITORY = Symbol("IPRODUCT_SALES_STAT_REDIS_REPOSITORY");