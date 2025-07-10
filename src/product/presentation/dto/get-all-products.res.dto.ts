import { ProductResult } from "@app/product/domain/dto/product.result.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray } from "class-validator";

export class GetAllProductsResDto {
  @IsArray()
  @Type(() => ProductResult)
  @ApiProperty({
    example: [
      { id: 1, name: "다이슨 에어랩", stock: 121, price: 1200000 },
      { id: 2, name: "애플 맥세이프 충전기 20W", stock: 1, price: 79000 },
      { id: 3, name: "무지 라운드넥 반팔티 Free(W/M)", stock: 1500, price: 24900 },
      { id: 4, name: "안경닦이 100x100", stock: 0, price: 500 },
      { id: 5, name: "미니 향균 티슈 250매", stock: 37, price: 2500 },
      { id: 6, name: "아디다스 삼선 슬리퍼 275mm", stock: 15, price: 65000 },
      { id: 7, name: "모나미 볼펜 12자루", stock: 1000, price: 5900 },
    ],
    description: "모든 상품 리스트",
  })
  products: ProductResult[];
}
