import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, Max } from "class-validator";

export class DeductStockReqDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "상품 식별자" })
  productId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "10", description: "차감 할 재고량" })
  amount: number;
}
