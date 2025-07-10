import { Test, TestingModule } from "@nestjs/testing";
import { CouponService } from "./coupon.service";
import { ICOUPON_REPOSITORY } from "../repository/coupon.repository.interface";
import { IMEMBER_COUPON_REPOSITORY } from "../repository/member_coupon.repository.interface";
import { TransactionService } from "@app/database/prisma/transaction.service";

describe("CouponService", () => {
  let service: CouponService;
  let transactionStub: any;
  let couponRepository: any;
  let memberCouponRepository: any;

  beforeEach(async () => {
    transactionStub = {
      executeInTransaction: jest.fn((cb) => cb({})),
    };
    couponRepository = {
      getAllAvailableCoupons: jest.fn(),
      findById: jest.fn(),
      addCoupon: jest.fn(),
      deductCoupon: jest.fn(),
      findByIdWithPessimisticLock: jest.fn(),
    };
    memberCouponRepository = {
      getCouponsByMemberAndCoupon: jest.fn(),
      issueCoupon: jest.fn(),
      useCoupon: jest.fn(),
      getCouponsByMember: jest.fn(),
      getCouponById: jest.fn(),
      getCouponsByIdAndMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        { provide: TransactionService, useValue: transactionStub },
        { provide: ICOUPON_REPOSITORY, useValue: couponRepository },
        { provide: IMEMBER_COUPON_REPOSITORY, useValue: memberCouponRepository },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
  });

  describe("getAllCoupons", () => {
    it("사용 가능한 쿠폰들을 전부 조회할 수 있어야 함  ", async () => {
      const mockCoupons = [{ id: 1, name: "쿠폰A" }];
      couponRepository.getAllAvailableCoupons.mockResolvedValue(mockCoupons);

      const result = await service.getAllCoupons();

      expect(result).toEqual(mockCoupons);
    });
  });

  describe("issueCoupon", () => {
    it("아직 쿠폰이 없다면 발급할 수 있어야 함  ", async () => {
      memberCouponRepository.getCouponsByMemberAndCoupon.mockResolvedValue(null);
      couponRepository.findByIdWithPessimisticLock.mockResolvedValue({ id: 1, stock: 5 });
      memberCouponRepository.issueCoupon.mockResolvedValue({ id: 100 });

      const result = await service.issueCoupon({ memberId: 1, couponId: 1 });

      expect(result).toEqual({ id: 100 });
    });

    it("이미 쿠폰을 가지고 있다면 발급하면 안 됨 ❌", async () => {
      memberCouponRepository.getCouponsByMemberAndCoupon.mockResolvedValue({ id: 999 });

      await expect(service.issueCoupon({ memberId: 1, couponId: 1 })).rejects.toThrow("ALREADY_HAVING_COUPON");
    });
  });

  describe("useCoupon", () => {
    it("보유 중이고 사용 안 한 쿠폰이면 사용할 수 있어야 함  ", async () => {
      memberCouponRepository.getCouponsByIdAndMember.mockResolvedValue({
        id: 1,
        isUsed: false,
        coupon: { type: "PERCENTAGE", offFigure: 10 },
      });
      memberCouponRepository.useCoupon.mockResolvedValue({ id: 1, isUsed: true });

      const result = await service.useCoupon({ memberId: 1, couponId: 1, amount: 1000 });

      expect(result).toEqual({ coupon: undefined, discountedAmount: 900 });
    });

    it("쿠폰이 없으면 사용할 수 없어야 함 ❌", async () => {
      memberCouponRepository.getCouponsByIdAndMember.mockResolvedValue(null);

      await expect(service.useCoupon({ memberId: 1, couponId: 1, amount: 1000 })).rejects.toThrow(
        "NOT_FOUND_MEMBER_COUPON",
      );
    });

    it("이미 사용한 쿠폰이면 또 쓸 수 없어야 함 ❌", async () => {
      memberCouponRepository.getCouponsByIdAndMember.mockResolvedValue({ id: 1, isUsed: true });

      await expect(service.useCoupon({ memberId: 1, couponId: 1, amount: 1000 })).rejects.toThrow(
        "ALREADY_USED_COUPON",
      );
    });

    it("정액 할인 쿠폰일 경우 할인금액이 할인 전 금액보다 큰 경우 사용할 수 없어야 함 ❌", async () => {
      memberCouponRepository.getCouponsByIdAndMember.mockResolvedValue({
        id: 1,
        isUsed: false,
        coupon: { type: "FLAT", offFigure: 2000 },
      });

      await expect(service.useCoupon({ memberId: 1, couponId: 1, amount: 1000 })).rejects.toThrow("CANT_USE_COUPON");
    });
  });

  describe("addCouponStock", () => {
    it("재고가 남아 있다면 쿠폰 재고를 늘릴 수 있어야 함  ", async () => {
      couponRepository.findByIdWithPessimisticLock.mockResolvedValue({ id: 1, stock: 10 });
      couponRepository.addCoupon.mockResolvedValue({ id: 1, stock: 11 });

      const result = await service.addCouponStock({ couponId: 1 });

      expect(result).toEqual({ id: 1, stock: 11 });
    });

    it("재고가 이미 최대라면 더 늘릴 수 없어야 함 ❌", async () => {
      couponRepository.findByIdWithPessimisticLock.mockResolvedValue({ id: 1, stock: 2_147_483_647 });

      await expect(service.addCouponStock({ couponId: 1 })).rejects.toThrow("OVER_COUPON_STOCK_LIMIT");
    });
  });

  describe("deductCouponStock", () => {
    it("재고가 있다면 쿠폰 재고를 차감할 수 있어야 함  ", async () => {
      couponRepository.findByIdWithPessimisticLock.mockResolvedValue({ id: 1, stock: 5 });
      couponRepository.deductCoupon.mockResolvedValue({ id: 1, stock: 4 });

      const result = await service.deductCouponStock({ couponId: 1 });

      expect(result).toEqual({ id: 1, stock: 4 });
    });

    it("재고가 0이라면 쿠폰을 차감하면 안 됨 ❌", async () => {
      couponRepository.findByIdWithPessimisticLock.mockResolvedValue({ id: 1, stock: 0 });

      await expect(service.deductCouponStock({ couponId: 1 })).rejects.toThrow("NOT_ENOUTH_STOCK");
    });
  });

  describe("getCouponsByMember", () => {
    it("회원이 가진 쿠폰 목록을 조회할 수 있어야 함  ", async () => {
      const mockCoupons = [{ id: 1, couponId: 101 }];
      memberCouponRepository.getCouponsByMember.mockResolvedValue(mockCoupons);

      const result = await service.getCouponsByMember({ memberId: 1 });

      expect(result).toEqual(mockCoupons);
    });
  });
});
