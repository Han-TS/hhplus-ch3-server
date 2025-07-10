import { MaxByteLength } from "@app/common/validator.common";
import { IsInt, IsPositive, IsString, Max, Min } from "class-validator";

export class ProductResult {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  id: number;

  @IsString()
  @MaxByteLength(191)
  name: string;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  stock: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  price: number;
}
