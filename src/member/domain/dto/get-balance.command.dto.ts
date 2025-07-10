import { IsInt, IsPositive, Max } from "class-validator";

export class GetBalanceCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;
}
