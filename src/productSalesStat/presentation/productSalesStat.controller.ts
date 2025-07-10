import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ProductSalesStatService } from "../domain/service/productSalesStat.service";
import { GetPopularProductsResDto } from "./dto/get-popular-products.res.dto";
import { AddProductSalesStatReqDto } from "./dto/add-product-sales-stat.req.dto";
import { AddProductSalesStatCommand } from "../domain/dto/add-product-sales-stat.command.dto";
import { AddProductSalesStatResDto } from "./dto/add-product-sales-stat-res.dto";
import { ProductSalesStatRedisService } from "../domain/service/productSalesStat.redis.service";
import { GetPopularProductsResV2Dto } from "./dto/get-popular-products.res.v2.dto";

@ApiTags("Product Sales Stat Management")
@Controller("productsalesstat")
export class ProductSalesStatController {
  constructor(
    private readonly productSalesStatService: ProductSalesStatService,
    private readonly productSalesStatRedisService: ProductSalesStatRedisService,
  ) {}

  @Get("top5")
  @ApiOperation({ summary: "getPopularProducts" })
  @ApiResponse({ status: 200, description: "200 - OK", type: GetPopularProductsResDto })
  async getPopularProducts(): Promise<GetPopularProductsResDto> {
    const products = await this.productSalesStatService.getPopularProducts();

    return { products: products };
  }

  @Get("redis/top5")
  @ApiOperation({ summary: "getPopularProductsRedis" })
  @ApiResponse({ status: 200, description: "200 - OK", type: GetPopularProductsResV2Dto })
  async getPopularProductsRedis(): Promise<GetPopularProductsResV2Dto> {
    const products = await this.productSalesStatRedisService.getPopularProducts();

    return { products: products };
  }

  // @Get("v2/top5")
  // @ApiOperation({ summary: "getPopularProducts" })
  // @ApiResponse({ status: 200, description: "200 - OK", type: GetPopularProductsResDto })
  // async getPopularProductsV2(): Promise<GetPopularProductsResDto> {
  //   const products = await this.productSalesStatService.getPopularProductsV2();

  //   return { products: products };
  // }

  @Post("add")
  @ApiOperation({ summary: "addProductSalesStat" })
  @ApiResponse({ status: 200, description: "200 - OK", type: AddProductSalesStatResDto })
  async addProductSalesStat(
    @Body() addProductSalesStatReqDto: AddProductSalesStatReqDto,
  ): Promise<AddProductSalesStatResDto> {
    const command: AddProductSalesStatCommand = {
      ...addProductSalesStatReqDto,
    };

    return await this.productSalesStatService.addProductSalesStat(command);
  }

  @Post("redis/add")
  @ApiOperation({ summary: "addProductSalesStatRedis" })
  @ApiResponse({ status: 200, description: "200 - OK", type: AddProductSalesStatResDto })
  async addProductSalesStatRedis(
    @Body() addProductSalesStatReqDto: AddProductSalesStatReqDto,
  ): Promise<AddProductSalesStatResDto> {
    const command: AddProductSalesStatCommand = {
      ...addProductSalesStatReqDto,
    };

    return await this.productSalesStatRedisService.addProductSalesStat(command);
  }
}
