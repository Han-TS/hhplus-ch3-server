import { Module } from "@nestjs/common";
import { CouponController } from "./presentation/coupon.controller";
import { CouponService } from "./domain/service/coupon.service";
import { ICOUPON_REPOSITORY } from "./domain/repository/coupon.repository.interface";
import { CouponRepository } from "./infrastructure/coupon.repository";
import { IMEMBER_COUPON_REPOSITORY } from "./domain/repository/member_coupon.repository.interface";
import { MemberCouponRepository } from "./infrastructure/member_coupon.repository";
import { PrismaModule } from "@app/database/prisma/prisma.module";
import { IMEMBER_COUPON_INDEX_REPOSITORY } from "./domain/repository/member_coupon_index.repository.interface";
import { MemberCouponIndexRepository } from "./infrastructure/member_coupon_index.repository";
import { RedisModule } from "@app/redis/redis.module";
import { CouponRedisService } from "./domain/service/coupon.redis.service";
import { ICOUPON_REDIS_REPOSITORY } from "./domain/repository/coupon.redis.repository.interface";
import { CouponRedisRepository } from "./infrastructure/coupon.redis.repository";
import { KafkaModule } from "@app/kafka/kafka.module";
import { IssueCouponRequestedConsumer } from "./infrastructure/issue-coupon-requested.consumer";

@Module({
  imports: [PrismaModule, RedisModule, KafkaModule],
  controllers: [CouponController],
  providers: [
    CouponService,
    CouponRedisService,
    IssueCouponRequestedConsumer,
    {
      provide: ICOUPON_REPOSITORY,
      useClass: CouponRepository
    },
    {
      provide: IMEMBER_COUPON_REPOSITORY,
      useClass: MemberCouponRepository
    },
    {
      provide: ICOUPON_REDIS_REPOSITORY,
      useClass: CouponRedisRepository
    },
    // {
    //   provide: IMEMBER_COUPON_INDEX_REPOSITORY,
    //   useClass: MemberCouponIndexRepository
    // }
  ],
  exports: [CouponService, CouponRedisService],
})
export class CouponModule {}
