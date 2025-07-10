import { IsInt, IsPositive, Max } from "class-validator";

export class GetOrderCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  orderId: number;
}
