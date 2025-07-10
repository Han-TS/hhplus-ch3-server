import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from './member.service';
import { IMEMBER_REPOSITORY, IMemberRepository } from '../repository/member.repository.interface';
import { IBALANCE_HISTORY_REPOSITORY, IBalanceRepository } from '../repository/balanceHistory.repository.interface';
import { MemberRepository } from '../../infrastructure/member.repository';
import { BalanceHisotryRepository } from '../../infrastructure/balanceHistory.repository';
import { PrismaService } from '@app/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { ChargeBalanceCommand } from '../dto/charge-balance.command.dto';
import { GetBalanceCommand } from '../dto/get-balance.command.dto';
import { UseBalanceCommand } from '../dto/use-balance.command.dto';
import { TransactionService } from '@app/database/prisma/transaction.service';
import { CacheService } from '@app/redis/redisCache.service';
import { RedisService } from '@app/redis/redis.service';

describe('MemberService Integration Test (with Testcontainers + Prisma)', () => {
  let memberService: MemberService;
  let prisma: PrismaService;
  let cacheService: CacheService;
  let redis: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        TransactionService,
        MemberService,
        {
          provide: IMEMBER_REPOSITORY,
          useClass: MemberRepository,
        },
        {
          provide: IBALANCE_HISTORY_REPOSITORY,
          useClass: BalanceHisotryRepository,
        },
        RedisService,
        CacheService
      ],
    }).compile();

    memberService = module.get<MemberService>(MemberService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);

    redis = module.get<RedisService>(RedisService);
    redis.onModuleInit();
  });

  afterAll(async() => {
    redis.onModuleDestroy();
  })

  beforeEach(async () => {
    const importSqlPath = path.resolve(__dirname, 'integration-test-util/import.sql');
    const sql = fs.readFileSync(importSqlPath, 'utf8');
  
    // 여러 SQL 문장을 실행할 수 있도록 분리
    const statements = sql.split(';').map(stmt => stmt.trim()).filter(stmt => stmt);
  
    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  })

  afterEach(async() => {
    await prisma.balance_History.deleteMany({});
    await prisma.member.deleteMany({});
    await cacheService.flushAll();
  })

  describe("getBalance", () => {
    it("회원 식별자 1의 잔액을 조회하면 1000원이 있음", async () => {
      const getBalanceCommand: GetBalanceCommand = {
        memberId: 1
      }

      const memberBalance = await memberService.getBalance(getBalanceCommand);

      expect(memberBalance.balance).toBe(1000);
    })

    it("회원 식별자 2의 잔액을 조회하면 2147483647원(저장 가능 최대 수치)이 있음", async () => {
      const getBalanceCommand: GetBalanceCommand = {
        memberId: 2
      }

      const memberBalance = await memberService.getBalance(getBalanceCommand);

      expect(memberBalance.balance).toBe(2147483647);
    })

    it("존재하지 않는 회원 식별자 3의 잔액을 조회하면 'MEMBER_NOT_FOUND' 메시지와 함께 에러 발생", async () => {
      const getBalanceCommand: GetBalanceCommand = {
        memberId: 3
      }

      await expect(memberService.getBalance(getBalanceCommand)).rejects.toThrow("MEMBER_NOT_FOUND");
    })
  })

  describe("chargeBalance", () => {
    it("회원 식별자 1에게 2500원을 충전하면 3500원이 있음", async () => {
      const chargeBalanceCommand: ChargeBalanceCommand = {
        memberId: 1,
        amount: 2500
      }

      const chargedMember = await memberService.chargeBalance(chargeBalanceCommand);

      expect(chargedMember.balance).toBe(3500);
    })

    it("회원 식별자 2에게 1원을 충전하면 'OVER_LIMIT_AMOUNT' 메시지와 함께 에러 발생", async () => {
      const chargeBalanceCommand: ChargeBalanceCommand = {
        memberId: 2,
        amount: 1
      }

      await expect(memberService.chargeBalance(chargeBalanceCommand)).rejects.toThrow("OVER_BALANCE_LIMIT")
    })

    it("존재하지 않는 회원 식별자 3의 잔액을 충전하면 'MEMBER_NOT_FOUND' 메시지와 함께 에러 발생", async () => {
      const chargeBalanceCommand: ChargeBalanceCommand = {
        memberId: 3,
        amount: 1
      }

      await expect(memberService.chargeBalance(chargeBalanceCommand)).rejects.toThrow("MEMBER_NOT_FOUND");
    })
  })

  describe("useBalance", () => {
    it("회원 식별자 1이 1001원을 사용하면 'NOT_ENOUTH_BALANCE' 메시지와 함께 에러 발생", async () => {
      const useBalanceCommand: UseBalanceCommand = {
        memberId: 1,
        amount: 1001
      }

      await expect(memberService.useBalance(useBalanceCommand)).rejects.toThrow("NOT_ENOUTH_BALANCE");
    })

    it("회원 식별자 2가 2147483647원을 사용하면 잔액이 0원이 됨", async () => {
      const useBalanceCommand: UseBalanceCommand = {
        memberId: 2,
        amount: 2147483647
      }

      const usedMember = await memberService.useBalance(useBalanceCommand);

      expect(usedMember.balance).toBe(0);
    })

    it("존재하지 않는 회원 식별자 3이 1원을 사용하면 'MEMBER_NOT_FOUND' 메시지와 함께 에러 발생", async () => {
      const useBalanceCommand: UseBalanceCommand = {
        memberId: 3,
        amount: 1
      }

      await expect(memberService.useBalance(useBalanceCommand)).rejects.toThrow("MEMBER_NOT_FOUND");
    })
  })
});
