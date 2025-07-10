import { IRepository } from "@app/database/repository.interface";
import { Member_Coupon, Prisma } from "@prisma/client";

export interface IMemberCouponRepository extends IRepository<Member_Coupon> {
  issueCoupon(memberId: number, couponId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon>;
  useCoupon(memberId: number, couponId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon>;
  useCouponV2(memberId: number, couponId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon>;
  getCouponById(couponId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon>;
  getCouponsByMember(memberId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon[]>;
  getCouponsByMemberAndCoupon(memberId: number, couponId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon>;
  getCouponsByIdAndMember(id: number, memberId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon>;
}

export const IMEMBER_COUPON_REPOSITORY = Symbol("IMEMBER_COUPON_REPOSITORY");