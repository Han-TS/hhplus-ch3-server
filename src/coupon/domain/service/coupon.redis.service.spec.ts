import { Test, TestingModule } from '@nestjs/testing';
import { CouponRedisService } from './coupon.redis.service';
import { ICOUPON_REPOSITORY } from '../repository/coupon.repository.interface';
import { IMEMBER_COUPON_REPOSITORY } from '../repository/member_coupon.repository.interface';
import { ICOUPON_REDIS_REPOSITORY } from '../repository/coupon.redis.repository.interface';
import { CouponRepository } from '@app/coupon/infrastructure/coupon.repository';
import { MemberCouponRepository } from '@app/coupon/infrastructure/member_coupon.repository';
import { CouponRedisRepository } from '@app/coupon/infrastructure/coupon.redis.repository';
import { TransactionService } from '@app/database/prisma/transaction.service';
import { BadRequestException } from '@nestjs/common';
import { KafkaEventPublisherService } from '@app/kafka/kafka-event-publisher.service';
import { IssueCouponRequstedEvent } from '@app/common/events/issue-coupon-requested.event';

describe('CouponRedisService 단위 테스트', () => {
  let service: CouponRedisService;

  const mockCouponRepo = {
    findById: jest.fn(),
    getAllAvailableCoupons: jest.fn(),
    updateCouponStock: jest.fn(),
  };

  const mockMemberCouponRepo = {
    getCouponsByIdAndMember: jest.fn(),
    useCouponV2: jest.fn(),
  };

  const mockRedisRepo = {
    enrollCouponStock: jest.fn(),
    enrollWaitQueue: jest.fn(),
    getLockForCouponScheduler: jest.fn(),
    releaseLockForCouponScheduler: jest.fn(),
    getMembersInQueue: jest.fn(),
    issueCoupon: jest.fn(),
    getCouponStock: jest.fn(),
    isCouponExists: jest.fn(),
    useCoupon: jest.fn(),
  };

  const mockTxService = {
    executeInTransaction: jest.fn().mockImplementation(fn => fn({})),
  };

  const mockKafkaPublisher = {
    publish: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponRedisService,
        { provide: ICOUPON_REPOSITORY, useValue: mockCouponRepo },
        { provide: IMEMBER_COUPON_REPOSITORY, useValue: mockMemberCouponRepo },
        { provide: ICOUPON_REDIS_REPOSITORY, useValue: mockRedisRepo },
        { provide: TransactionService, useValue: mockTxService },
        { provide: KafkaEventPublisherService, useValue: mockKafkaPublisher }
      ],
    }).compile();

    service = module.get<CouponRedisService>(CouponRedisService);
  });

  describe('getAllCoupons()', () => {
    it('모든 사용 가능한 쿠폰 목록을 조회할 수 있다', async () => {
      mockCouponRepo.getAllAvailableCoupons.mockResolvedValueOnce(['coupon1']);
      const result = await service.getAllCoupons();
      expect(result).toEqual(['coupon1']);
      expect(mockCouponRepo.getAllAvailableCoupons).toHaveBeenCalled();
    });
  });

  describe('enrollCouponStock()', () => {
    it('Redis에 쿠폰 재고를 등록할 수 있다', async () => {
      await service.enrollCouponStock(1, 100);
      expect(mockRedisRepo.enrollCouponStock).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('requestIssueCoupon()', () => {
    it('쿠폰 발급 대기열에 멤버를 등록할 수 있다', async () => {
      const topic = 'issue.coupon.requested';
      const key = '1'
      const value = JSON.stringify(new IssueCouponRequstedEvent(1, 1, 2));

      // Outbox 저장용 트랜잭션 Mock
      const mockCreate = jest.fn().mockResolvedValueOnce({ id: 1 });
      mockTxService.executeInTransaction.mockImplementationOnce(async (fn) => {
        await fn({ outbox: { create: mockCreate } }); // tx.outbox.create
      });
      
      await service.requestIssueCoupon({ couponId: 1, memberId: 2 });
      
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          topic,
          key,
          value: { couponId: 1, memberId: 2 },
          status: 'init',
        },
      });
      expect(mockKafkaPublisher.publish).toHaveBeenCalledWith({topic, key, value});
    });
  });

  describe('processIssueCoupon()', () => {
    const outboxId = 1;
    const couponId = 1;
    const memberId = 2;

    const mockUpdate = jest.fn();
    const mockQueryRawUnsafe = jest.fn();
    const mockIssueCoupon = jest.fn();

    afterEach(() => {
      jest.clearAllMocks();
    })

    it('status가 init이면 쿠폰 발급을 진행하고 상태를 done으로 변경한다', async () => {
      mockQueryRawUnsafe.mockResolvedValueOnce([{ status: 'init' }]);
      mockIssueCoupon.mockResolvedValueOnce(true);
      mockTxService.executeInTransaction.mockImplementation(async (fn) => {
        return await fn({
          $queryRawUnsafe: mockQueryRawUnsafe,
          outbox: { update: mockUpdate },
        });
      });

      mockRedisRepo.issueCoupon = mockIssueCoupon;

      await service.processIssueCoupon(outboxId, couponId, memberId);

      expect(mockQueryRawUnsafe).toHaveBeenCalledWith(
        `SELECT status FROM Outbox WHERE id = ${outboxId} FOR UPDATE`
      );
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: outboxId },
        data: { status: 'received' },
      });
      expect(mockIssueCoupon).toHaveBeenCalledWith(couponId, memberId);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: outboxId },
        data: { status: 'done' },
      });
    });

    it('status가 init이 아니면 아무 것도 하지 않는다', async () => {
      mockQueryRawUnsafe.mockResolvedValueOnce([{ status: 'done' }]);
      mockTxService.executeInTransaction.mockImplementation(async (fn) => {
        return await fn({
          $queryRawUnsafe: mockQueryRawUnsafe,
          outbox: { update: mockUpdate },
        });
      });

      mockRedisRepo.issueCoupon = mockIssueCoupon;

      await service.processIssueCoupon(outboxId, couponId, memberId);

      expect(mockQueryRawUnsafe).toHaveBeenCalledWith(
        `SELECT status FROM Outbox WHERE id = ${outboxId} FOR UPDATE`
      );
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockIssueCoupon).not.toHaveBeenCalled();
    });

    it('알 수 없는 에러 발생 시 커스텀 에러를 throw한다', async () => {
      mockQueryRawUnsafe.mockRejectedValueOnce(new Error('DB connection lost'));

      await expect(
        service.processIssueCoupon(outboxId, couponId, memberId)
      ).rejects.toThrow('쿠폰 발급 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.');
    });
  });

  describe('useCoupon()', () => {
    it('Redis에 쿠폰이 없으면 예외를 발생시킨다', async () => {
      mockRedisRepo.isCouponExists.mockResolvedValueOnce(false);

      await expect(service.useCoupon({ memberId: 1, couponId: 2, amount: 1000 }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('FLAT 타입 쿠폰이 성공적으로 적용되고 사용 처리된다', async () => {
      mockRedisRepo.isCouponExists.mockResolvedValueOnce(true);
      mockMemberCouponRepo.getCouponsByIdAndMember.mockResolvedValueOnce(null);
      mockCouponRepo.findById.mockResolvedValueOnce({
        id: 2,
        type: 'FLAT',
        offFigure: 300,
      });
    
      const result = await service.useCoupon({ memberId: 1, couponId: 2, amount: 1000 });
    
      expect(result.discountedAmount).toBe(700);
      expect(mockRedisRepo.useCoupon).toHaveBeenCalled();
      expect(mockMemberCouponRepo.useCouponV2).toHaveBeenCalled();
    });

    it('PERCENTAGE 타입 쿠폰이 성공적으로 적용되고 사용 처리된다', async () => {
      mockRedisRepo.isCouponExists.mockResolvedValueOnce(true);
      mockMemberCouponRepo.getCouponsByIdAndMember.mockResolvedValueOnce(null);
      mockCouponRepo.findById.mockResolvedValueOnce({
        id: 2,
        type: 'PERCENTAGE',
        offFigure: 10,
      });
    
      const result = await service.useCoupon({ memberId: 1, couponId: 2, amount: 1000 });
    
      expect(result.discountedAmount).toBe(900);
      expect(mockRedisRepo.useCoupon).toHaveBeenCalled();
      expect(mockMemberCouponRepo.useCouponV2).toHaveBeenCalled();
    });
  });
});
