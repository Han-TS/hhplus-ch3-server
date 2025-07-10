import { IsInt, IsPositive, Max, Min } from "class-validator";

export class BalanceResult {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  balance: number;
}
