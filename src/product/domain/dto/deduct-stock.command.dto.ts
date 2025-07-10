import { IsInt, IsPositive, Max } from "class-validator";

export class DeductStockCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  productId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  amount: number;
}
