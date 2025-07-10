import { Inject, Injectable } from "@nestjs/common";
import { AddProductSalesStatCommand, PaidProduct } from "../dto/add-product-sales-stat.command.dto";
import { AddProductSalesStatResult } from "../dto/add-product-sales-stat.result.dto";
import { ProductSalesStatRedisResult } from "../dto/product-sales-stat.result.redis.dto";
import { ProductSalesStatRedisRepository } from "@app/productSalesStat/infrastructure/product_sales_stat.redis.repository";
import { IPRODUCT_SALES_STAT_REDIS_REPOSITORY } from "../repository/product_sales_stat.redis.interface.repository";

@Injectable()
export class ProductSalesStatRedisService {
  constructor(
    @Inject(IPRODUCT_SALES_STAT_REDIS_REPOSITORY)
    private readonly productSalesStatRedisRepository: ProductSalesStatRedisRepository
  ) {}

  async addProductSalesStat(command: AddProductSalesStatCommand): Promise<AddProductSalesStatResult> {
    const salesDate: Date = command.salesDate;
    const paidProducts: PaidProduct[] = command.paidProducts;

    try {
      let total_paidSales = 0;
      for(const paidProduct of paidProducts) {
        await this.productSalesStatRedisRepository.recordSales(salesDate, paidProduct);

        total_paidSales += paidProduct.total_sales;
      }

      return { total_sales: total_paidSales };
    } catch (error) {
      throw new Error("상품 판매 이력 추가 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요." + error)
    }
  }

  async getPopularProducts(): Promise<ProductSalesStatRedisResult[]> {
    const raw = await this.productSalesStatRedisRepository.getTop5ProductByScore();

    if(!raw) return [];

    const parsed: { productId: string; amount: number }[] = JSON.parse(raw);

    return parsed.map((entry, index) => ({
      rank: index + 1,
      productId: parseInt(entry.productId, 10),
      amount: entry.amount,
    }));
  }
}