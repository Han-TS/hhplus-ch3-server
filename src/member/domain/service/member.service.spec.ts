import { Test, TestingModule } from "@nestjs/testing";
import { MemberService } from "./member.service";
import { MemberRepository } from "../../infrastructure/member.repository";
import { GetBalanceCommand } from "../dto/get-balance.command.dto";
import { ChargeBalanceCommand } from "../dto/charge-balance.command.dto";
import { UseBalanceCommand } from "../dto/use-balance.command.dto";
import { BalanceResult } from "../dto/balance.result.dto";
import { IMEMBER_REPOSITORY } from "../repository/member.repository.interface";
import { IBALANCE_HISTORY_REPOSITORY } from "../repository/balanceHistory.repository.interface";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { Member } from "@prisma/client";
import { CacheService } from "@app/redis/redisCache.service";

describe("MemberService", () => {
  let memberService: MemberService;
  let transactionStub: any;
  let memberRepositoryStub: any;
  let balanceHistoryRepositoryStub: any;
  let cacheService: any;

  beforeEach(async () => {
    transactionStub = {
      executeInTransaction: jest.fn((cb) => cb({})),
    };
    memberRepositoryStub = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      find: jest.fn(),
      updateBalance: jest.fn(),
      updateBalanceWithOptimisticLock: jest.fn(),
    };
    balanceHistoryRepositoryStub = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      find: jest.fn(),
      addHistory: jest.fn(),
    };
    cacheService = {
      getOrSet: jest.fn(),
      refresh: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: TransactionService, useValue: transactionStub },
        { provide: IMEMBER_REPOSITORY, useValue: memberRepositoryStub },
        { provide: IBALANCE_HISTORY_REPOSITORY, useValue: balanceHistoryRepositoryStub },
        { provide: CacheService, useValue: cacheService },
      ],
    }).compile();

    memberService = module.get<MemberService>(MemberService);
  });

  it("should be defined", () => {
    expect(memberService).toBeDefined();
  });

  describe("getBalance", () => {
    it("4000원이 충전되어 있는 사용자의 잔액을 확인하면 4000원이 있어야 함 ", async () => {
      // mock & stub settings
      const mockMember: Member = { id: 1, name: "psy", version: 1, balance: 4000 };
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockMember);
      (cacheService.getOrSet as jest.Mock).mockImplementation(async (_key, _dto, _ttl, fetcherFn) => {
        return fetcherFn(); // fetcher 직접 호출
      });

      // dto settings
      const getBalanceCommand: GetBalanceCommand = { memberId: 1 };

      // real service calls
      const result: BalanceResult = await memberService.getBalance(getBalanceCommand);

      // expectactions
      expect(result.balance).toBe(mockMember.balance);
      expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.findById).toHaveBeenCalledWith(1, {});
    });

    it("존재하지 않는 사용자의 잔액을 조회하면 'MEMBER_NOT_FOUND' 메시지와 함께 에러 발생❌", async () => {
      // mock & stub settings
      const mockMember = null;
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockMember);
      (cacheService.getOrSet as jest.Mock).mockImplementation(async (_key, _dto, _ttl, fetcherFn) => {
        return fetcherFn(); // fetcher 직접 호출
      });

      // dto settings
      const getBalanceCommand: GetBalanceCommand = { memberId: 1 };

      // real service calls & expectations
      await expect(memberService.getBalance(getBalanceCommand)).rejects.toThrow("MEMBER_NOT_FOUND");
      // expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe("chargeBalance", () => {
    it("1000원이 충전되어 있는 사용자가 2000원을 충전하면 3000원이 있어야 함 ", async () => {
      // mock & stub settings
      const mockFindMember: Member = { id: 1, name: "psy", version: 1, balance: 1000 };
      const mockChargedMember: Member = { id: 1, name: "psy", version: 2, balance: 3000 };
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockFindMember);
      (memberRepositoryStub.updateBalanceWithOptimisticLock as jest.Mock).mockResolvedValue(mockChargedMember);

      // dto settings
      const chargeBalanceCommand: ChargeBalanceCommand = { memberId: 1, amount: 2000 };

      // real service calls
      const result: BalanceResult = await memberService.chargeBalance(chargeBalanceCommand);

      // expectactions
      expect(result.balance).toBe(3000);
      expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.findById).toHaveBeenCalledWith(1, {});
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).toHaveBeenCalledWith(
        1,
        3000,
        expect.any(Number),
        {},
      );
      expect(balanceHistoryRepositoryStub.addHistory).toHaveBeenCalledTimes(1);
      expect(balanceHistoryRepositoryStub.addHistory).toHaveBeenCalledWith(1, 2000, {});
    });

    it("존재하지 않는 사용자가 2000원을 충전하면 'MEMBER_NOT_FOUND' 메시지와 함께 에러 발생❌", async () => {
      // mock & stub settings
      const mockFindMember: Member = null;
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockFindMember);

      // dto settings
      const chargeBalanceCommand: ChargeBalanceCommand = { memberId: 1, amount: 2000 };

      // real service calls & expectactions
      await expect(memberService.chargeBalance(chargeBalanceCommand)).rejects.toThrow("MEMBER_NOT_FOUND");
      expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.findById).toHaveBeenCalledWith(1, {});
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).not.toHaveBeenCalled();
      expect(balanceHistoryRepositoryStub.addHistory).not.toHaveBeenCalled();
    });

    it("1000원이 충전되어 있는 사용자가 2_147_482_648원을 충전하면 'OVER_BALANCE_LIMIT' 메시지와 함께 에러 발생❌", async () => {
      // mock & stub settings
      const mockFindMember: Member = { id: 1, name: "psy", version: 1, balance: 3000 };
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockFindMember);

      // dto settings
      const chargeBalanceCommand: ChargeBalanceCommand = { memberId: 1, amount: 2_147_482_648 };

      // real service calls & expectations
      await expect(memberService.chargeBalance(chargeBalanceCommand)).rejects.toThrow("OVER_BALANCE_LIMIT");
      expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.findById).toHaveBeenCalledWith(1, {});
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).not.toHaveBeenCalled();
      expect(balanceHistoryRepositoryStub.addHistory).not.toHaveBeenCalled();
    });
  });

  describe("useBalance", () => {
    it("10000원이 충전되어 있는 사용자가 4000원을 사용하면 6000원이 있어야 함 ", async () => {
      // mock & stub settings
      const mockFindMember: Member = { id: 1, name: "psy", version: 1, balance: 10000 };
      const mockUsedMember: Member = { id: 1, name: "psy", version: 2, balance: 6000 };
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockFindMember);
      (memberRepositoryStub.updateBalanceWithOptimisticLock as jest.Mock).mockResolvedValue(mockUsedMember);

      // dto settings
      const useBalanceCommand: UseBalanceCommand = { memberId: 1, amount: 4000 };

      // real service calls
      const result: BalanceResult = await memberService.useBalance(useBalanceCommand);

      // expectactions
      expect(result.balance).toBe(6000);
      expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.findById).toHaveBeenCalledWith(1, {});
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).toHaveBeenCalledWith(
        1,
        6000,
        expect.any(Number),
        {},
      );
      expect(balanceHistoryRepositoryStub.addHistory).toHaveBeenCalledTimes(1);
      expect(balanceHistoryRepositoryStub.addHistory).toHaveBeenCalledWith(1, -4000, {});
    });

    it("존재하지 않는 사용자자가 4000원을 사용하면 'MEMBER_NOT_FOUND' 메시지와 함께 에러 발생❌", async () => {
      // mock & stub settings
      const mockFindMember: Member = null;
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockFindMember);

      // dto settings
      const useBalanceCommand: UseBalanceCommand = { memberId: 1, amount: 4000 };

      // real service calls & expectactions
      await expect(memberService.useBalance(useBalanceCommand)).rejects.toThrow("MEMBER_NOT_FOUND");
      expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.findById).toHaveBeenCalledWith(1, {});
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).not.toHaveBeenCalled();
      expect(balanceHistoryRepositoryStub.addHistory).not.toHaveBeenCalled();
    });

    it("3000원이 충전되어 있는 사용자가 4000원을 사용하면 'INVALID_AMOUNT' 메시지와 함께 에러 발생❌", async () => {
      // mock & stub settings
      const mockFindMember: Member = { id: 1, name: "psy", version: 1, balance: 3000 };
      (memberRepositoryStub.findById as jest.Mock).mockResolvedValue(mockFindMember);

      // dto settings
      const useBalanceCommand: UseBalanceCommand = { memberId: 1, amount: 4000 };

      // real service calls & expectations
      await expect(memberService.useBalance(useBalanceCommand)).rejects.toThrow("NOT_ENOUTH_BALANCE");
      expect(memberRepositoryStub.findById).toHaveBeenCalledTimes(1);
      expect(memberRepositoryStub.findById).toHaveBeenCalledWith(1, {});
      expect(memberRepositoryStub.updateBalanceWithOptimisticLock).not.toHaveBeenCalled();
      expect(balanceHistoryRepositoryStub.addHistory).not.toHaveBeenCalled();
    });
  });
});
