import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@app/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { CouponService } from './coupon.service';
import { ICOUPON_REPOSITORY } from '../repository/coupon.repository.interface';
import { CouponRepository } from '@app/coupon/infrastructure/coupon.repository';
import { IMEMBER_COUPON_REPOSITORY } from '../repository/member_coupon.repository.interface';
import { MemberCouponRepository } from '@app/coupon/infrastructure/member_coupon.repository';
import { TransactionService } from '@app/database/prisma/transaction.service';

describe('CouponService Concurrency Test', () => {
  let couponService: CouponService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        TransactionService,
        CouponService,
        {
          provide: ICOUPON_REPOSITORY,
          useClass: CouponRepository,
        },
        {
          provide: IMEMBER_COUPON_REPOSITORY,
          useClass: MemberCouponRepository,
        },
      ],
    }).compile();

    couponService = module.get<CouponService>(CouponService);
    prisma = module.get<PrismaService>(PrismaService);
  });

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
    await prisma.member_Coupon.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.member.deleteMany({});
  })

  describe("issueCoupon", () => {
    it("재고가 2개 있는 쿠폰을 5명이 동시에 발급하면 2명만 발급받아야 함", async () => {
      const results = await Promise.allSettled([
        couponService.issueCoupon({memberId: 1, couponId: 1}),
        couponService.issueCoupon({memberId: 2, couponId: 1}),
        couponService.issueCoupon({memberId: 3, couponId: 1}),
        couponService.issueCoupon({memberId: 4, couponId: 1}),
        couponService.issueCoupon({memberId: 5, couponId: 1}),
      ]);

      const success_count = results.filter((item) => item.status === "fulfilled");
      const afterStock = await prisma.coupon.findUnique({select: { stock: true }, where: { id: 1 }})

      expect(success_count.length).toBe(2);
      expect(afterStock.stock).toBe(0);
    }, 20000)

    it("재고가 2개 있는 쿠폰을 한 사용자가 동시에 발급하면 1장만 발급되어야 함", async () => {
      const results = await Promise.allSettled([
        couponService.issueCoupon({memberId: 1, couponId: 1}),
        couponService.issueCoupon({memberId: 1, couponId: 1}),
        couponService.issueCoupon({memberId: 1, couponId: 1}),
        couponService.issueCoupon({memberId: 1, couponId: 1}),
        couponService.issueCoupon({memberId: 1, couponId: 1}),
      ]);

      const success_count = results.filter((item) => item.status === "fulfilled");
      const afterStock = await prisma.coupon.findUnique({select: { stock: true }, where: { id: 1 }})

      expect(success_count.length).toBe(1);
      expect(afterStock.stock).toBe(1);
    }, 20000)
  })
});
