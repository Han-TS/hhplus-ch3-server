import { IsInt, IsPositive, Max } from "class-validator";

export class CancelOrderCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  orderId: number;
}
