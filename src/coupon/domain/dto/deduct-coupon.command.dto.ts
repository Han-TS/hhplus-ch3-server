import { IsInt, IsPositive, Max } from "class-validator";

export class DeductCouponCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  couponId: number;
}