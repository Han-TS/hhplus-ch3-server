import { MaxByteLength } from "@app/common/validator.common";
import { IsInt, IsPositive, IsString, Max, Min } from "class-validator";

export class ProductSalesStatResult {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  rank: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  productId: number;

  @IsString()
  @MaxByteLength(191)
  productName: string;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  amount: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  sales: number;
}
