export interface ICouponRedisRepository {
  enrollCouponStock(couponId: number, stock: number): Promise<void>;
  enrollWaitQueue(couponId: number, memberId: number): Promise<boolean>;
  getMembersInQueue(couponId: number, maxCount: number): Promise<string[]>;
  getCouponStock(couponId: number): Promise<number>;
  getLockForCouponScheduler(couponId: number): Promise<string>;
  releaseLockForCouponScheduler(couponId: number): Promise<void>;
  issueCoupon(couponId: number, memberId: number): Promise<boolean>;
  useCoupon(couponId: number, memberId: number): Promise<void>;
  isCouponExists(couponId: number, memberId: number): Promise<boolean>;
}

export const ICOUPON_REDIS_REPOSITORY = Symbol("ICOUPON_REDIS_REPOSITORY");