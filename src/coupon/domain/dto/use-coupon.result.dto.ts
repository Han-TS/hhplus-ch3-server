import { IsInt, IsObject, Max, Min } from "class-validator"
import { Coupon } from "@prisma/client"

export class UseCouponResult {
  @IsObject()
  coupon: Coupon;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  discountedAmount: number;
}