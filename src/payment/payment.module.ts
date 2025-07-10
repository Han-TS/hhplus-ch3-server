import { PrismaModule } from "@app/database/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { PaymentController } from "./presentation/payment.controller";
import { PaymentService } from "./domain/service/payment.service";
import { PaymentRepository } from "./infrastructure/payment.repository";
import { IPAYMENT_REPOSITORY } from "./domain/repository/payment.repository.interface";
import { MemberModule } from "@app/member/member.module";
import { OrderModule } from "@app/order/order.module";
import { ProductModule } from "@app/product/product.module";
import { ProductSalesStatModule } from "@app/productSalesStat/productSalesStat.module";
import { PaymentFacade } from "./application/payment.facade";
import { PrismaClient } from "@prisma/client";
import { CouponModule } from "@app/coupon/coupon.module";
import { RedisModule } from "@app/redis/redis.module";
import { CqrsModule } from "@nestjs/cqrs";
import { PayCompletedListener } from "@app/notify/application/event-listener/pay-completed.listener";
import { NotifyModule } from "@app/notify/notify.module";
import { KafkaModule } from "@app/kafka/kafka.module";

@Module({
  imports: [PrismaModule, MemberModule, OrderModule, ProductModule, CouponModule, ProductSalesStatModule, RedisModule, KafkaModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentFacade,
    {
      provide: IPAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
  ],
})
export class PaymentModule {}
