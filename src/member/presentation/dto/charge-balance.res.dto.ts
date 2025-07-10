import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, Max, Min } from "class-validator";

export class ChargeBalanceControllerResDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "회원 식별자" })
  memberId: number;

  @IsInt()
  @IsPositive()
  @ApiProperty({ example: 5500, description: "충전 후 잔액" })
  balance: number;
}
