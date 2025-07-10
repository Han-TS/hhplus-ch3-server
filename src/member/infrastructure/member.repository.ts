import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@app/database/prisma/prisma.service";
import { IMemberRepository } from "../domain/repository/member.repository.interface";
import { Member, Prisma } from "@prisma/client";

@Injectable()
export class MemberRepository extends PrismaRepository<Member> implements IMemberRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.member);
  }

  async updateBalance(id: number, balance: number, tx?: Prisma.TransactionClient): Promise<Member> {
    const client = tx ?? this.prisma;
    
    return await this.updateById(id, { balance }, client);
  }

  async updateBalanceWithOptimisticLock(id: number, balance: number, version: number, tx: Prisma.TransactionClient): Promise<Member> {
    
    const maxRetries = 3;
    for (let attemp = 1; attemp <= maxRetries; attemp++) {
      const updated = await tx.member.updateMany({
        where: {
          id,
          version
        },
        data: {
          balance,
          version: { increment: 1 },
        }
      })

      if (updated.count === 1) {
        return await this.findById(id, tx);
      }
    }

    throw new Error("LOCK_CONFLICT");
  }
}
