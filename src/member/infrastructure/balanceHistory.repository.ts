import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@app/database/prisma/prisma.service";
import { IBalanceRepository } from "../domain/repository/balanceHistory.repository.interface";
import { Balance_History, Prisma } from "@prisma/client";

@Injectable()
export class BalanceHisotryRepository extends PrismaRepository<Balance_History> implements IBalanceRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.balance_History);
  }

  async addHistory(memberId, amount, tx?: Prisma.TransactionClient): Promise<Balance_History> {
    const client = tx ?? this.prisma;

    return await client.balance_History.create({
      data: {
        memberId,
        amount
      }
    });
  }
}
