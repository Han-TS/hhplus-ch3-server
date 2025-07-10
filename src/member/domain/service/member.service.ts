import { BadRequestException, HttpException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BalanceResult } from "../dto/balance.result.dto";
import { GetBalanceCommand } from "../dto/get-balance.command.dto";
import { ChargeBalanceCommand } from "../dto/charge-balance.command.dto";
import { UseBalanceCommand } from "../dto/use-balance.command.dto";
import { MemberRepository } from "../../infrastructure/member.repository";
import { BalanceHisotryRepository } from "../../infrastructure/balanceHistory.repository";
import { IMEMBER_REPOSITORY } from "../repository/member.repository.interface";
import { IBALANCE_HISTORY_REPOSITORY } from "../repository/balanceHistory.repository.interface";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { Member, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { CacheService } from "@app/redis/redisCache.service";

@Injectable()
export class MemberService {
  constructor(
    @Inject(IMEMBER_REPOSITORY)
    private readonly memberRepository: MemberRepository,
    @Inject(IBALANCE_HISTORY_REPOSITORY)
    private readonly balanceHistoryRepository: BalanceHisotryRepository,
    private readonly transactionService: TransactionService,
    private readonly cacheService: CacheService,
  ) {}

  async getBalance(command: GetBalanceCommand, txc?: Prisma.TransactionClient): Promise<BalanceResult> {
    const memberId: number = command.memberId;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const cacheKey = `member:${memberId}`;
        const ttl = 300;

        return this.cacheService.getOrSet(
          cacheKey,
          BalanceResult,
          ttl,
          async() => {
            const result: Member = await this.memberRepository.findById(memberId, client);

            if (result === null) {
              throw new NotFoundException("MEMBER_NOT_FOUND");
            }
    
            const balanceResult: BalanceResult = {
              memberId: result.id,
              balance: result.balance,
            };
    
            return balanceResult;
          }
        );
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("보유 잔액 조회 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async chargeBalance(command: ChargeBalanceCommand, txc?: Prisma.TransactionClient): Promise<BalanceResult> {
    const memberId = command.memberId;
    const amount = command.amount;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const member: Member = await this.memberRepository.findById(memberId, client);
        if (member === null) {
          throw new NotFoundException("MEMBER_NOT_FOUND");
        }
        if (member.balance + amount > 2_147_483_647) {
          throw new BadRequestException("OVER_BALANCE_LIMIT");
        }
    
        const result: Member = await this.memberRepository.updateBalanceWithOptimisticLock(memberId, member.balance + amount, member.version, client);
        await this.balanceHistoryRepository.addHistory(memberId, amount, client);
    
        const balanceResult: BalanceResult = {
          memberId: result.id,
          balance: result.balance,
        };

        const cacheKey = `member:${memberId}`;
        const ttl = 300;
        await this.cacheService.refresh(cacheKey, BalanceResult, balanceResult, ttl)
    
        return balanceResult;
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("잔액 충전 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });

  }

  async useBalance(command: UseBalanceCommand, txc?: Prisma.TransactionClient): Promise<BalanceResult> {
    const memberId = command.memberId;
    const amount = command.amount;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const member: Member = await this.memberRepository.findById(memberId, client);
        if (member === null) {
          throw new NotFoundException("MEMBER_NOT_FOUND");
        }
        if (member.balance < amount) {
          throw new BadRequestException("NOT_ENOUTH_BALANCE");
        }
    
        const result: Member = await this.memberRepository.updateBalanceWithOptimisticLock(memberId, member.balance - amount, member.version, client);
        await this.balanceHistoryRepository.addHistory(memberId, -1 * amount, client);
    
        const balanceResult: BalanceResult = {
          memberId: result.id,
          balance: result.balance,
        };

        const cacheKey = `member:${memberId}`;
        const ttl = 300;
        await this.cacheService.refresh(cacheKey, BalanceResult, balanceResult, ttl)
    
        return balanceResult;
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("잔액 사용 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });

  }
}
