import { IsInt, IsPositive, Max } from "class-validator";

export class UseCouponCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  couponId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  amount: number;
}
