import { ProductSalesStatRedisResult } from "@app/productSalesStat/domain/dto/product-sales-stat.result.redis.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray } from "class-validator";

export class GetPopularProductsResV2Dto {
  @IsArray()
  @Type(() => ProductSalesStatRedisResult)
  @ApiProperty({
    example: [
      { rank: 1, productId: 2, amount: 700 },
      { rank: 2, productId: 5, amount: 342 },
      { rank: 3, productId: 7, amount: 321 },
      { rank: 4, productId: 1, amount: 50 },
      { rank: 5, productId: 3, amount: 1 },
    ],
    description: "D-3 ~ D-1 간의 판매량 Top5",
  })
  products: ProductSalesStatRedisResult[];
}
