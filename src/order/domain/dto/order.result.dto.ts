import { IsEnum, IsInt, IsPositive, Max, Min } from "class-validator";
import { OrderStatus } from "./order-status.enum";

export class OrderResult {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  id: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  totalSales: number;

  @IsEnum(OrderResult)
  status: OrderStatus;
}
