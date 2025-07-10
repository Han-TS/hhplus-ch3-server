import { MaxByteLength } from "@app/common/validator.common";
import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive, IsString, Max, Min } from "class-validator";

export class GetProductResDto {
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  @ApiProperty({ example: "1", description: "상품 식별자" })
  id: number;

  @IsString()
  @MaxByteLength(191)
  @ApiProperty({ example: "다이슨 에어랩", description: "상품명" })
  name: string;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: "121", description: "재고량" })
  stock: number;

  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  @ApiProperty({ example: "1200000", description: "가격" })
  price: number;
}
