import { Module } from "@nestjs/common";
import { OrderService } from "./domain/service/order.service";
import { OrderController } from "./presentation/order.controller";
import { PrismaModule } from "@app/database/prisma/prisma.module";
import { OrderRepository } from "./infrastructure/order.repository";
import { OrderProductRepository } from "./infrastructure/order_product.repository";
import { IORDER_REPOSITORY } from "./domain/repository/order.repository.interface";
import { IORDER_PRODUCT_REPOSITORY } from "./domain/repository/order_product.repository.interface";
import { IORDER_DENORM_REPOSITORY } from "./domain/repository/order_denorm.repository.interface";
import { OrderDenormRepository } from "./infrastructure/order_denorm.repository";

@Module({
  imports: [PrismaModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: IORDER_REPOSITORY,
      useClass: OrderRepository,
    },
    {
      provide: IORDER_PRODUCT_REPOSITORY,
      useClass: OrderProductRepository,
    },
    // {
    //   provide: IORDER_DENORM_REPOSITORY,
    //   useClass: OrderDenormRepository
    // }
  ],
  exports: [OrderService],
})
export class OrderModule {}
