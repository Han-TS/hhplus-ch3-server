import { ProductSalesStatResult } from "../../domain/dto/product-sales-stat.result.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray } from "class-validator";

export class GetPopularProductsResDto {
  @IsArray()
  @Type(() => ProductSalesStatResult)
  @ApiProperty({
    example: [
      { rank: 1, productId: 2, productName: "애플 맥세이프 충전기 20W", amount: 700, sales: 55300000 },
      { rank: 2, productId: 5, productName: "미니 향균 티슈 250매", amount: 342, sales: 855000 },
      { rank: 3, productId: 7, productName: "모나미 볼펜 12자루", amount: 321, sales: 321000 },
      { rank: 4, productId: 1, productName: "다이슨 에어랩", amount: 50, sales: 60500000 },
      { rank: 5, productId: 3, productName: "무지 라운드넥 반팔티 Free(W/M)", amount: 1, sales: 24900 },
    ],
    description: "D-3 ~ D-1 간의 판매량 Top5",
  })
  products: ProductSalesStatResult[];
}
