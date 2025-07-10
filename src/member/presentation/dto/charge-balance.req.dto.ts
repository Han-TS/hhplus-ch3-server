import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, Max } from "class-validator";

export class ChargeBalanceControllerReqDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "회원 식별자" })
  memberId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 500, description: "충전금액" })
  amount: number;
}
