import { MaxByteLength } from "@app/common/validator.common";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsPositive, IsString, Max } from "class-validator";

export class IssueCouponResDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "발행 쿠폰 식별자" })
  id: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "회원 식별자" })
  memberId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "쿠폰 식별자" })
  couponId: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsIn([true, false])
  @ApiProperty({ example: "false", description: "사용 여부" })
  isUsed: boolean;
}
