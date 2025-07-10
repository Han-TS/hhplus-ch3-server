import { MaxByteLength } from "@app/common/validator.common";
import { ApiProperty } from "@nestjs/swagger";
import { Coupon } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsObject, IsPositive, IsString, Max, Min } from "class-validator";

export class UseCouponResDto {
  @IsObject()
  @ApiProperty({ description: "사용한 쿠폰 정보" })
  coupon: Coupon;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: "9000", description: "쿠폰이 반영된 금액" })
  discountedAmount: number;
}
