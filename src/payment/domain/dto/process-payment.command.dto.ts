import { IsDate, IsInt, IsOptional, IsPositive, Max } from "class-validator";

export class ProcessPaymentCommand {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  orderId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  couponId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsDate()
  approved_at: Date;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  amount: number;
}
