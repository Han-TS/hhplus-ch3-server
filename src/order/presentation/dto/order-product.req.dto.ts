import { Product } from "@app/order/domain/dto/order-product.command.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsPositive, Max } from "class-validator";

export class OrderProductReqDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "회원 식별자" })
  memberId: number;

  @IsArray()
  @Type(() => Product)
  @ApiProperty({
    example: [
      { productId: 1, price: 1200000, amount: 2 },
      { productId: 3, price: 24900, amount: 1 },
    ],
    description: "주문 할 상품 리스트",
  })
  products: Product[];
}
