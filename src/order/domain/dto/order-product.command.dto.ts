import { Type } from "class-transformer";
import { IsArray, IsInt, IsPositive, Max, Min } from "class-validator";

export class OrderProductCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsArray()
  @Type(() => Product)
  products: Product[];
}

export class Product {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  id: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  price: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  amount: number;
}
