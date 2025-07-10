import { Module } from "@nestjs/common";
import { ProductService } from "./domain/service/product.service";
import { ProductController } from "./presentation/product.controller";
import { PrismaModule } from "@app/database/prisma/prisma.module";
import { ProductRepository } from "./infrastructure/product.repository";
import { IPRODUCT_REPOSITORY } from "./domain/repository/product.repository.interface";
import { RedisModule } from "@app/redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    {
      provide: IPRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
  ],
  exports: [ProductService],
})
export class ProductModule {}
