import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@app/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { CouponService } from './coupon.service';
import { ICOUPON_REPOSITORY } from '../repository/coupon.repository.interface';
import { CouponRepository } from '@app/coupon/infrastructure/coupon.repository';
import { IMEMBER_COUPON_REPOSITORY } from '../repository/member_coupon.repository.interface';
import { MemberCouponRepository } from '@app/coupon/infrastructure/member_coupon.repository';
import { GetCouponsByMemberCommand } from '../dto/get-coupons-by-member.command.dto';
import { IssueCouponCommand } from '../dto/issue-coupon.command.dto';
import { UseCouponCommand } from '../dto/use-coupon.command.dto';
import { AddCouponCommand } from '../dto/add-coupon.command.dto';
import { DeductCouponCommand } from '../dto/deduct-coupon.command.dto';
import { TransactionService } from '@app/database/prisma/transaction.service';

describe('CouponService Integration Test (with Testcontainers + Prisma)', () => {
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
    const importSqlPath = path.resolve(__dirname, 'integration-test-util/import.sql');
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

  describe("getAllCoupons", () => {
    it("모든 쿠폰 리스트를 조회하면 2개의 쿠폰이 있고 해당 정보를 확인 가능, 재고가 0개인 쿠폰 조회 불가", async () => {
      const predictResult = [
        { id: 1, name: '10% 할인 쿠폰', type: 'PERCENTAGE', offFigure:10, stock: 2147483647 },
        { id: 2, name: '1000원 할인 쿠폰', type: 'FLAT', offFigure: 1000, stock: 1 },
      ]

      const result = await couponService.getAllCoupons();

      expect(result).toEqual(predictResult);
    })
  })

  describe("getCouponsByMember", () => {
    it("회원 식별자 31의 쿠폰을 조회하면 2개의 쿠폰이 있음", async () => {
      const getCouponsByMemberCommand: GetCouponsByMemberCommand = {
        memberId: 31
      }
      const predictResult = [
        { id: 1, memberId: 31, couponId: 1, isUsed: false },
        { id: 2, memberId: 31, couponId: 2, isUsed: true }
      ]

      const result = await couponService.getCouponsByMember(getCouponsByMemberCommand);

      expect(result).toEqual(predictResult);
    })

    it("회원 식별자 33의 쿠폰을 조회하면 비어있는 배열을 반환함", async () => {
      const getCouponsByMemberCommand: GetCouponsByMemberCommand = {
        memberId: 33
      }
      const predictResult = [];

      const result = await couponService.getCouponsByMember(getCouponsByMemberCommand);

      expect(result).toEqual(predictResult);
    })
  })

  describe("issueCoupon", () => {
    it("회원 식별자 31이 쿠폰 식별자 1을 발급하려 하면 'ALREADY_HAVING_COUPON' 메시지와 함께 에러 발생", async () => {
      const issueCouponCommand: IssueCouponCommand = {
        memberId: 31,
        couponId: 1
      }

      await expect(couponService.issueCoupon(issueCouponCommand)).rejects.toThrow("ALREADY_HAVING_COUPON");
    })

    it("회원 식별자 32가 쿠폰 식별자 1을 발급하면 해당 쿠폰을 정상 발급 처리함", async () => {
      const issueCouponCommand: IssueCouponCommand = {
        memberId: 32,
        couponId: 1
      }
      const predictResult = {
        id: expect.any(Number),
        memberId: 32,
        couponId: 1,
        isUsed: false
      }

      const result = await couponService.issueCoupon(issueCouponCommand);

      expect(result).toEqual(predictResult);
    })
  })

  describe("useCoupon", () => {
    it("회원 식별자 31이 쿠폰 식별자 1을 사용하면 쿠폰을 사용처리 하며 할인된 금액을 반환함", async () => {
      const useCouponCommand: UseCouponCommand = {
        memberId: 31,
        couponId: 1,
        amount: 1000
      }
      const predictResult = {
        coupon: {
          id: 1,
          name: '10% 할인 쿠폰',
          type: 'PERCENTAGE',
          stock: 2147483647,
          offFigure: 10
        },
        discountedAmount: 900
      }

      const result = await couponService.useCoupon(useCouponCommand);

      expect(result).toEqual(predictResult);
    })

    it("회원 식별자 32가 쿠폰 식별자 1을 사용하려 하면 'NOT_FOUND_MEMBER_COUPON' 메시지와 함께 에러 발생", async () => {
      const useCouponCommand: UseCouponCommand = {
        memberId: 32,
        couponId: 1,
        amount: 1000
      }

      await expect(couponService.useCoupon(useCouponCommand)).rejects.toThrow("NOT_FOUND_MEMBER_COUPON");
    })

    it("회원 식별자 31이 쿠폰 식별자 2를 사용하려 하면 'ALREADY_USED_COUPON' 메시지와 함께 에러 발생", async () => {
      const useCouponCommand: UseCouponCommand = {
        memberId: 31,
        couponId: 2,
        amount: 1000
      }

      await expect(couponService.useCoupon(useCouponCommand)).rejects.toThrow("ALREADY_USED_COUPON");
    })

    it("회원 식별자 32가 9999원 결제시에 쿠폰 식별자 2를 사용하려 하면 'CANT_USE_COUPON' 메시지와 함께 에러 발생", async () => {
      const useCouponCommand: UseCouponCommand = {
        memberId: 32,
        couponId: 3,
        amount: 9999
      }

      await expect(couponService.useCoupon(useCouponCommand)).rejects.toThrow("CANT_USE_COUPON");
    })
  })

  describe("addCouponStcok", () => {
    it("쿠폰 식별자 1에 재고를 추가하면 'OVER_COUPON_STOCK_LIMIT' 메시지와 함께 에러 발생", async () => {
      const addCouponStockCommand: AddCouponCommand = {
        couponId: 1
      }

      await expect(couponService.addCouponStock(addCouponStockCommand)).rejects.toThrow("OVER_COUPON_STOCK_LIMIT");
    })

    it("쿠폰 식별자 3에 재고를 추가하면 재고가 1이 됨", async () => {
      const addCouponStockCommand: AddCouponCommand = {
        couponId: 3
      }
      const predictResult = {
        id: 3,
        name: '10000원 할인 쿠폰',
        type: 'FLAT',
        offFigure: 10000,
        stock: 1
      }

      const result = await couponService.addCouponStock(addCouponStockCommand);

      expect(result).toEqual(predictResult);
    })

    it("존재하지 않는 쿠폰 식별자 100에 재고를 추가하면 'NOT_FOUND_COUPON' 메시지와 함께 에러 발생", async () => {
      const addCouponCommand: AddCouponCommand = {
        couponId: 100
      }

      await expect(couponService.addCouponStock(addCouponCommand)).rejects.toThrow("NOT_FOUND_COUPON");
    })
  })

  describe("deductCouponStock", () => {
    it("쿠폰 식별자 2에 재고를 차감하면 재고가 0이 됨", async () => {
      const deductCouponCommand: DeductCouponCommand = {
        couponId: 2
      }
      const predictResult = {
        id: 2,
        name: '1000원 할인 쿠폰',
        type: 'FLAT',
        offFigure: 1000,
        stock: 0
      }

      const result = await couponService.deductCouponStock(deductCouponCommand);

      expect(result).toEqual(predictResult);
    })

    it("쿠폰 식별자 3에 재고를 차감하면 'NOT_ENOUTH_STOCK' 메시지와 함께 에러 발생", async () => {
      const deductCouponCommand: DeductCouponCommand = {
        couponId: 3
      }

      await expect(couponService.deductCouponStock(deductCouponCommand)).rejects.toThrow("NOT_ENOUTH_STOCK");
    })

    it("존재하지 않는 쿠폰 식별자 100에 재고를 차감하면 'NOT_FOUND_COUPON' 메시지와 함께 에러 발생", async () => {
      const deductCouponCommand: DeductCouponCommand = {
        couponId: 100
      }

      await expect(couponService.deductCouponStock(deductCouponCommand)).rejects.toThrow("NOT_FOUND_COUPON");
    })
  })
});
