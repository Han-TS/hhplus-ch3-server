import { Injectable } from "@nestjs/common";
import { IProductSalesStatRedisRepository } from "../domain/repository/product_sales_stat.redis.interface.repository";
import { PaidProduct } from "../domain/dto/add-product-sales-stat.command.dto";
import { RedisService } from "@app/redis/redis.service";

@Injectable()
export class ProductSalesStatRedisRepository implements IProductSalesStatRedisRepository {
  constructor(private readonly redisService: RedisService) {}

  async recordSales(salesDate: Date, paidProduct: PaidProduct): Promise<boolean> {
    const salesDateString = salesDate
      .toISOString()
      .split("T")[0];

    const recordKey = `product:salesStat:${salesDateString}`;

    const client = this.redisService.getClient();
    await client.zincrby(recordKey, paidProduct.total_amount, paidProduct.productId);

    // TTL 3일 (초 단위) 설정 (이미 있으면 갱신 안 함)
    const ttl = await client.ttl(recordKey);
    if (ttl === -1) {
      await client.expire(recordKey, 3 * 24 * 60 * 60); // 3일
    }

    return true;
  }
  
  async getTop5ProductByScore(): Promise<string> {
    const client = this.redisService.getClient();
    const raw = await client.get('product:sales:top5');

    return raw;
  }
}