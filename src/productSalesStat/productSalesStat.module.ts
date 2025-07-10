import { PrismaModule } from "@app/database/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { ProductSalesStatController } from "./presentation/productSalesStat.controller";
import { ProductSalesStatService } from "./domain/service/productSalesStat.service";
import { ProductSalesStatRepository } from "./infrastructure/product_sales_stat.repository";
import { IPRODUCT_SALES_STAT_REPOSITORY } from "./domain/repository/product_sales_stat.interface.repository";
import { IPRODUCT_SALES_STAT_VIEW_REPOSITORY } from "./domain/repository/product_sales_stat_view.interface.repository";
import { ProductSalesStatViewRepository } from "./infrastructure/product_sales_stat_view.repository";
import { RedisModule } from "@app/redis/redis.module";
import { IPRODUCT_SALES_STAT_REDIS_REPOSITORY } from "./domain/repository/product_sales_stat.redis.interface.repository";
import { ProductSalesStatRedisRepository } from "./infrastructure/product_sales_stat.redis.repository";
import { ProductSalesStatRedisService } from "./domain/service/productSalesStat.redis.service";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ProductSalesStatController],
  providers: [
    ProductSalesStatService,
    ProductSalesStatRedisService,
    {
      provide: IPRODUCT_SALES_STAT_REPOSITORY,
      useClass: ProductSalesStatRepository,
    },
    {
      provide: IPRODUCT_SALES_STAT_REDIS_REPOSITORY,
      useClass: ProductSalesStatRedisRepository
    }
    // {
    //   provide: IPRODUCT_SALES_STAT_VIEW_REPOSITORY,
    //   useClass: ProductSalesStatViewRepository,
    // },
  ],
  exports: [ProductSalesStatService, ProductSalesStatRedisService],
})
export class ProductSalesStatModule {}
