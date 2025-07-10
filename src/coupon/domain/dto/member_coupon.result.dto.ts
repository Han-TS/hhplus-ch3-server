import { MaxByteLength } from "@app/common/validator.common";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsPositive, IsString, Max } from "class-validator";

export class MemberCouponResult {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  id: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  couponId: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsIn([true, false])
  isUsed: boolean;
}
