import { IRepository } from "@app/database/repository.interface";
import { Balance_History, Prisma } from "@prisma/client";

export interface IBalanceRepository extends IRepository<Balance_History> {
  addHistory(memberId, amount, tx?: Prisma.TransactionClient): Promise<Balance_History>;
}

export const IBALANCE_HISTORY_REPOSITORY = Symbol("IBALANCE_HISTORY_REPOSITORY");
