import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, Max, Min } from "class-validator";

export class UseBalanceControllerReqDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: 1, description: "회원 식별자" })
  memberId: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: 500, description: "사용금액" })
  amount: number;
}
