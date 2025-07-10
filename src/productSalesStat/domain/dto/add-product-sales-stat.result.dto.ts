import { IsInt, Max, Min } from "class-validator";

export class AddProductSalesStatResult {
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  total_sales: number;
}
