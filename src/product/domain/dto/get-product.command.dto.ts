import { IsInt, IsPositive, Max } from "class-validator";

export class GetProductCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  productId: number;
}
