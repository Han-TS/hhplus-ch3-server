import { OrderStatus } from "@app/order/domain/dto/order-status.enum";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNumber, IsOptional, IsPositive, Max, Min } from "class-validator";

export class CancelOrderResDto {
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

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: 2424900, description: "총 가격" })
  totalSales: number;

  @IsEnum(OrderStatus)
  @ApiProperty({ example: OrderStatus.ORDER_CANCEL, description: "주문 상태" })
  status: OrderStatus;
}
