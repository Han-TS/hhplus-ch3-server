import { MaxByteLength } from "@app/common/validator.common";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDate, IsInt, IsPositive, IsString, Max, Min } from "class-validator";

export class AddProductSalesStatReqDto {
  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: "2025-03-10", description: "판매 날짜" })
  salesDate: Date;

  @IsArray()
  @Type(() => PaidProduct)
  @ApiProperty({
    example: [
      { productId: 1, productName: "다이슨 에어랩", total_amount: 1, total_sales: 1200000 },
      { productId: 2, productName: "애플 맥세이프 충전기 20W", total_amount: 10, total_sales: 790000 },
      { productId: 7, productName: "모나미 볼펜 12자루", total_amount: 1000, total_sales: 5900000 },
    ],
    description: "판매 상품 정보",
  })
  paidProducts: PaidProduct[];
}

export class PaidProduct {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "상품 식별자" })
  productId: number;

  @IsString()
  @MaxByteLength(191)
  @ApiProperty({ example: "다이슨 에어랩", description: "상품명" })
  productName: string;

  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "판매 수량" })
  total_amount: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: "1200000", description: "판매 금액" })
  total_sales: number;
}
