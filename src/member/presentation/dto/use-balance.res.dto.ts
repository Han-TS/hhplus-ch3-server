import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, Max, Min } from "class-validator";

export class UseBalanceControllerResDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "회원 식별자" })
  memberId: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: 4500, description: "사용 후 잔액" })
  balance: number;
}
