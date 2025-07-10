import { IsInt, IsPositive, Max } from "class-validator";

export class ChargeBalanceCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  amount: number;
}
