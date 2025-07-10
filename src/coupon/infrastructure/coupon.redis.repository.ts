import { RedisService } from "@app/redis/redis.service";
import { ICouponRedisRepository } from "../domain/repository/coupon.redis.repository.interface";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CouponRedisRepository implements ICouponRedisRepository {
  constructor(private readonly redisService: RedisService) {}

  async enrollCouponStock(couponId: number, stock: number): Promise<void> {
    const stockKey = `coupon:${couponId}:stock`;

    const redisClient = this.redisService.getClient();
    await redisClient.set(stockKey, stock);

    return;
  }

  async enrollWaitQueue(couponId: number, memberId: number): Promise<boolean> {
    const now = Date.now();
    const queueKey = `coupon:${couponId}:queue`;
    const value = `${memberId}`;

    const redisClient = this.redisService.getClient();
    return (await redisClient.zadd(queueKey, now, value)) === 1;
  }

  async getMembersInQueue(couponId: number, maxCount: number): Promise<string[]> {
    const queueKey = `coupon:${couponId}:queue`;

    const redisClient = this.redisService.getClient();
    return await redisClient.zrange(queueKey, 0, maxCount - 1);
  }

  async getCouponStock(couponId: number): Promise<number> {
    const stockKey = `coupon:${couponId}:stock`;

    const redisClient = this.redisService.getClient();
    return Number(await redisClient.get(stockKey));
  }

  async getLockForCouponScheduler(couponId: number): Promise<string> {
    const lockKey = `lock:coupon:${couponId}`;

    const redisClient = this.redisService.getClient();
    const lock = await redisClient.set(lockKey, '1', 'NX');

    return lock;
  }

  async releaseLockForCouponScheduler(couponId: number): Promise<void> {
    const lockKey = `lock:coupon:${couponId}`;

    const redisClient = this.redisService.getClient();
    await redisClient.del(lockKey);
  }

  async issueCoupon(couponId: number, memberId: number): Promise<boolean> {
    const queueKey = `coupon:${couponId}:queue`;
    const stockKey = `coupon:${couponId}:stock`;
    const userCouponKey = `member:${memberId}:coupons`;

    const redisClient = this.redisService.getClient();

    const alreadyIssued = await redisClient.hexists(userCouponKey, couponId.toString());
    const stock = await redisClient.decr(stockKey);

    if (alreadyIssued || stock < 0) {
      await redisClient.incr(stockKey); // 복구
      await redisClient.zrem(queueKey, memberId);

      return false;
    }

    await redisClient.hset(userCouponKey, couponId, '0'); // 0: 미사용
    await redisClient.expire(userCouponKey, 60 * 60 * 24 * 30); // TTL 30일
    await redisClient.zrem(queueKey, memberId);

    return true;
  }

  async useCoupon(couponId: number, memberId: number): Promise<void> {
    const userCouponKey = `member:${memberId}:coupons`;

    const redisClient = this.redisService.getClient();
    await redisClient.hset(userCouponKey, couponId, '1');
  }

  async isCouponExists(couponId: number, memberId: number): Promise<boolean> {
    const userCouponKey = `member:${memberId}:coupons`;

    const redisClient = this.redisService.getClient();
    const couponStatus = await redisClient.hget(userCouponKey, couponId.toString());

    return couponStatus === "0";
  }
}