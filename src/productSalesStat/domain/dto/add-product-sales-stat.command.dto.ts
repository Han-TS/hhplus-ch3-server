import { MaxByteLength } from "@app/common/validator.common";
import { Type } from "class-transformer";
import { IsArray, IsDate, IsInt, IsPositive, IsString, Max, Min } from "class-validator";

export class AddProductSalesStatCommand {
  @IsDate()
  salesDate: Date;

  @IsArray()
  @Type(() => PaidProduct)
  paidProducts: PaidProduct[];
}

export class PaidProduct {
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
  total_amount: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  total_sales: number;
}
