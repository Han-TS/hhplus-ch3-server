import { MaxByteLength } from "@app/common/validator.common";
import { IsInt, IsPositive, IsString, Max, Min } from "class-validator";

export class ProductSalesStatRedisResult {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  rank: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  productId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  amount: number;
}
