import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";

export class AddProductSalesStatResDto {
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: "7890000", description: "주문 내 총 판매액" })
  total_sales: number;
}
