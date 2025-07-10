import { Module } from "@nestjs/common";
import { MemberModule } from "./member/member.module";
import { CouponModule } from "./coupon/coupon.module";
import { ProductModule } from "./product/product.module";
import { OrderModule } from "./order/order.module";
import { ProductSalesStatModule } from "./productSalesStat/productSalesStat.module";
import { PaymentModule } from "./payment/payment.module";
import { ScheduleModule } from "@nestjs/schedule";
import { ViewRefreshService } from "./common/schedules/view-refresh.service";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DuplicateRequestInterceptor } from "./common/interceptors/duplicate-request.interceptor";
import { RedisModule } from "./redis/redis.module";
import { SalesStatScheduler } from "./common/schedules/salesStats.scheduler.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { NotifyModule } from "./notify/notify.module";
import { KafkaModule } from "./kafka/kafka.module";
import { OutboxModule } from "./outbox/outbox.module";

@Module({
  imports: [
    MemberModule, 
    CouponModule, 
    ProductModule, 
    OrderModule, 
    ProductSalesStatModule, 
    PaymentModule,
    ScheduleModule.forRoot(),
    RedisModule,
    EventEmitterModule.forRoot(),
    NotifyModule,
    KafkaModule,
    OutboxModule
  ],
  providers: [
    ViewRefreshService,
    SalesStatScheduler,
    {
      provide: APP_INTERCEPTOR,
      useClass: DuplicateRequestInterceptor,
    },
  ],
})
export class AppModule {}
