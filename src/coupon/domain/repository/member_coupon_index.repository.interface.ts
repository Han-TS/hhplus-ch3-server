import { IRepository } from "@app/database/repository.interface";
import { Member_Coupon_Index, Prisma } from "@prisma/client";

export interface IMemberCouponIndexRepository extends IRepository<Member_Coupon_Index> {
  getCouponsByMember(memberId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon_Index[]>;
}

export const IMEMBER_COUPON_INDEX_REPOSITORY = Symbol("IMEMBER_COUPON_INDEX_REPOSITORY");