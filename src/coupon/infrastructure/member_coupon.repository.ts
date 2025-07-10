import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { Coupon, Member_Coupon, Prisma } from "@prisma/client";
import { IMemberCouponRepository } from "../domain/repository/member_coupon.repository.interface";
import { PrismaService } from "@app/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MemberCouponRepository extends PrismaRepository<Member_Coupon> implements IMemberCouponRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.member_Coupon);
  }

  async issueCoupon(memberId: number, couponId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon> {
    const client = tx ?? this.prisma;

    return await this.create({ memberId, couponId, isUsed: false }, client);
  }

  async useCoupon(memberId: number, couponId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    
    return await client.member_Coupon.update({
      where: { id_memberId: {
        id: couponId,
        memberId
      } },
      data: {
        isUsed: true
      },
      include: {
        coupon: true
      }
    })
  }

  async useCouponV2(memberId: number, couponId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon> {
    const client = tx ?? this.prisma;

    return await this.create({ memberId, couponId, isUsed: true }, client);
  }

  async getCouponById(couponId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.member_Coupon.findUnique({
      where: { id: couponId },
      include: { coupon: true }
    })
  }

  async getCouponsByMember(memberId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon[]> {
    const client = tx ?? this.prisma;

    return await client.member_Coupon.findMany({
      where: { memberId },
    })
  }

  async getCouponsByMemberAndCoupon(memberId: number, couponId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.member_Coupon.findUnique({
      where: { memberId_couponId: { memberId, couponId } },
      include: { coupon: true }
    })
  }

  async getCouponsByIdAndMember(id: number, memberId: number, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.member_Coupon.findUnique({
      where: { id_memberId: { id, memberId } },
      include: { coupon: true }
    })
  }
}