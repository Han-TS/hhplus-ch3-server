import { IsInt, IsPositive, Max } from "class-validator";

export class GetCouponsByMemberCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;
}
