import { OrderStatus } from "@app/order/domain/dto/order-status.enum";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsPositive, Max, Min } from "class-validator";

export class PayOrderResDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "주문 식별자" })
  id: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "회원 식별자" })
  memberId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "쿠폰 식별자" })
  couponId: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: 2424900, description: "총 가격" })
  totalSales: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: 1212450, description: "할인 가격" })
  discountedSales: number;

  @IsEnum(OrderStatus)
  @ApiProperty({ example: OrderStatus.PAYMENT_COMPLETED, description: "주문 상태" })
  status: OrderStatus;
}
