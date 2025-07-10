import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, Max, Min } from "class-validator";

export class UseCouponReqDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "회원 식별자" })
  memberId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "2", description: "쿠폰 식별자" })
  couponId: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: "10000", description: "결제 할 금액(쿠폰 반영 전)" })
  amount: number;
}
