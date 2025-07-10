import { HttpException, Inject, Injectable } from "@nestjs/common";
import { ProductSalesStatResult } from "../dto/product-sales-stat.result.dto";
import { AddProductSalesStatResult } from "../dto/add-product-sales-stat.result.dto";
import { Prisma, Product_Sales_Stat } from "@prisma/client";
import { ProductSalesStatRepository } from "../../infrastructure/product_sales_stat.repository";
import { AddProductSalesStatCommand, PaidProduct } from "../dto/add-product-sales-stat.command.dto";
import { IPRODUCT_SALES_STAT_REPOSITORY } from "../repository/product_sales_stat.interface.repository";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { IPRODUCT_SALES_STAT_VIEW_REPOSITORY } from "../repository/product_sales_stat_view.interface.repository";
import { ProductSalesStatViewRepository } from "@app/productSalesStat/infrastructure/product_sales_stat_view.repository";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { CacheService } from "@app/redis/redisCache.service";

@Injectable()
export class ProductSalesStatService {
  constructor(
    @Inject(IPRODUCT_SALES_STAT_REPOSITORY)
    protected readonly productSalesStatRepository: ProductSalesStatRepository,
    // @Inject(IPRODUCT_SALES_STAT_VIEW_REPOSITORY)
    // protected readonly productSalesStatViewRepository: ProductSalesStatViewRepository,
    private readonly transactionService: TransactionService,
    private readonly cacheService: CacheService
  ) {}

  async getPopularProducts(txc?: Prisma.TransactionClient): Promise<ProductSalesStatResult[]> {
    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const lockKey = `popularProducts`
        const ttl = 24 * 60 * 60;
        return this.cacheService.getOrSetArray(
          lockKey,
          ProductSalesStatResult,
          ttl,
          async() => {
            const result = await this.productSalesStatRepository.getTop5ProductByAmountLast3Days(client);
            const formatted = result.map(r => ({ ...r, rank: Number(r.rank), amount: Number(r.amount), sales: Number(r.sales) }));

            return formatted;
          }
        )

      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("인기 상품 조회 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  // async getPopularProductsV2(txc?: Prisma.TransactionClient): Promise<ProductSalesStatResult[]> {
  //   return await this.transactionService.executeInTransaction(async (tx) => {
  //     const client = txc ?? tx;

  //     return await this.productSalesStatViewRepository.getTop5ProductByAmountLast3Days(client);
  //   });
  // }

  async addProductSalesStat(command: AddProductSalesStatCommand, txc?: Prisma.TransactionClient): Promise<AddProductSalesStatResult> {
    const salesDate: Date = command.salesDate;
    const paidProducts: PaidProduct[] = command.paidProducts;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        let total_paidSales = 0;
        for (const paidProduct of paidProducts) {
          const productStat: Product_Sales_Stat[] = await this.productSalesStatRepository.findStatWithPessimisticLock(salesDate, paidProduct.productId, client);
          if (productStat.length == 0) {
            await this.productSalesStatRepository.create({ salesDate, ...paidProduct }, client);
          } else {
            const paidProductAmount = paidProduct.total_amount;
            const paidProductSales = paidProduct.total_sales;
            await this.productSalesStatRepository.updateById(productStat[0].id, {
              total_amount: productStat[0].total_amount + paidProductAmount,
              total_sales: productStat[0].total_sales + paidProductSales,
            }, client);
          }
    
          total_paidSales += paidProduct.total_sales;
        }
    
        return { total_sales: total_paidSales };
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("상품 판매 이력 추가 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }
}
