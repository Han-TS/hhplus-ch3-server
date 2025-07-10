import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { Coupon, Member_Coupon, Member_Coupon_Index, Prisma } from "@prisma/client";
import { PrismaService } from "@app/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { IMemberCouponIndexRepository } from "../domain/repository/member_coupon_index.repository.interface";

@Injectable()
export class MemberCouponIndexRepository extends PrismaRepository<Member_Coupon_Index> implements IMemberCouponIndexRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.member_Coupon);
  }

  async getCouponsByMember(memberId: number, tx?: Prisma.TransactionClient): Promise<Member_Coupon_Index[]> {
    const client = tx ?? this.prisma;

    return await client.member_Coupon.findMany({
      where: { memberId },
    })
  }
}