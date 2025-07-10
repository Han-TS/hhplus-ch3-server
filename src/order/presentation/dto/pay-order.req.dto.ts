import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsPositive, Max } from "class-validator";

export class PayOrderReqDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "주문 식별자" })
  orderId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "쿠폰 식별자" })
  couponId: number;
}
