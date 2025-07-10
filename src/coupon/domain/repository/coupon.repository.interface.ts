import { IRepository } from "@app/database/repository.interface";
import { Coupon, Prisma } from "@prisma/client";

export interface ICouponRepository extends IRepository<Coupon> {
  findByIdWithPessimisticLock(couponId: number, tx: Prisma.TransactionClient): Promise<Coupon | null>;
  getAllAvailableCoupons(tx?: Prisma.TransactionClient): Promise<Coupon[]>
  addCoupon(couponId: number, tx?: Prisma.TransactionClient): Promise<Coupon>;
  deductCoupon(couponId: number, tx?: Prisma.TransactionClient): Promise<Coupon>;
  updateCouponStock(couponId: number, stock: number, tx?: Prisma.TransactionClient): Promise<Coupon>;
}

export const ICOUPON_REPOSITORY = Symbol("ICOUPON_REPOSITORY");