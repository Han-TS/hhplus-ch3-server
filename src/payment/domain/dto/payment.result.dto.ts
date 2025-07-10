import { MaxByteLength } from "@app/common/validator.common";
import { IsDate, IsInt, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";

export class PaymentResult {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  id: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  orderId: number;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  memberId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  couponId: number;

  @IsString()
  @MaxByteLength(191)
  status: string;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  paid_amount: number;

  @IsOptional()
  @IsDate()
  approved_at: Date;
}
