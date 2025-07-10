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

describe('MemberService Concurrency Test', () => {
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
        CacheService,
        RedisService,
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
    const importSqlPath = path.resolve(__dirname, 'integration-test-util/import_concurrency.sql');
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
  })

  describe("useBalance", () => {
    it("10000원을 가진 사용자가 5000원 사용을 동시에 5번 시도하면 최대 2번만 성공해야 함(낙관적 락)", async () => {
      const result = await Promise.allSettled([
        memberService.useBalance({memberId: 1, amount: 5000}),
        memberService.useBalance({memberId: 1, amount: 5000}),
        memberService.useBalance({memberId: 1, amount: 5000}),
        memberService.useBalance({memberId: 1, amount: 5000}),
        memberService.useBalance({memberId: 1, amount: 5000}),
      ])

      const success_count = result.filter((item) => item.status === "fulfilled").length;
      const afterBalance = await prisma.member.findUnique({select: {balance: true}, where: {id: 1}});

      expect(afterBalance.balance).toBe(10000 - success_count * 5000);
      expect(afterBalance.balance).toBeGreaterThanOrEqual(0);
    })
  })

  describe("chargeBalance", () => {
    it("10000원을 가진 사용자가 5000원 사용을 동시에 5번 시도하면 성공한 만큼 잔액이 있어야 함(낙관적 락)", async () => {
      const result = await Promise.allSettled([
        memberService.chargeBalance({memberId: 1, amount: 5000}),
        memberService.chargeBalance({memberId: 1, amount: 5000}),
        memberService.chargeBalance({memberId: 1, amount: 5000}),
        memberService.chargeBalance({memberId: 1, amount: 5000}),
        memberService.chargeBalance({memberId: 1, amount: 5000}),
      ])

      const success_count = result.filter((item) => item.status === "fulfilled").length;
      const afterBalance = await prisma.member.findUnique({select: {balance: true}, where: {id: 1}});

      expect(afterBalance.balance).toBe(10000 + success_count * 5000);
    })
  })
});
