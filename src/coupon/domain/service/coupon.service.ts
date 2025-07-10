import { BadRequestException, HttpException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { IssueCouponCommand } from "../dto/issue-coupon.command.dto";
import { UseCouponCommand } from "../dto/use-coupon.command.dto";
import { GetCouponsByMemberCommand } from "../dto/get-coupons-by-member.command.dto";
import { CouponResult } from "../dto/coupon.result.dto";
import { MemberCouponResult } from "../dto/member_coupon.result.dto";
import { CouponRepository } from "../../infrastructure/coupon.repository";
import { MemberCouponRepository } from "../../infrastructure/member_coupon.repository";
import { ICOUPON_REPOSITORY } from "../repository/coupon.repository.interface";
import { IMEMBER_COUPON_REPOSITORY } from "../repository/member_coupon.repository.interface";
import { AddCouponCommand } from "../dto/add-coupon.command.dto";
import { DeductCouponCommand } from "../dto/deduct-coupon.command.dto";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { Member_Coupon, Prisma } from "@prisma/client";
import { UseCouponResult } from "../dto/use-coupon.result.dto";
import { IMEMBER_COUPON_INDEX_REPOSITORY } from "../repository/member_coupon_index.repository.interface";
import { MemberCouponIndexRepository } from "@app/coupon/infrastructure/member_coupon_index.repository";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Injectable()
export class CouponService {
  constructor(
    @Inject(ICOUPON_REPOSITORY)
    private readonly couponRepository: CouponRepository,
    @Inject(IMEMBER_COUPON_REPOSITORY)
    private readonly memberCouponRepository: MemberCouponRepository,
    // @Inject(IMEMBER_COUPON_INDEX_REPOSITORY)
    // private readonly memberCouponIndexRepository: MemberCouponIndexRepository,
    private readonly transactionService: TransactionService,
  ) {}

  async getAllCoupons(txc?: Prisma.TransactionClient): Promise<CouponResult[]> {
    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        return await this.couponRepository.getAllAvailableCoupons(client);
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("쿠폰 리스트 조회 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async issueCoupon(command: IssueCouponCommand, txc?: Prisma.TransactionClient): Promise<MemberCouponResult> {
    const memberId = command.memberId;
    const couponId = command.couponId;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const member_coupon = await this.memberCouponRepository.getCouponsByMemberAndCoupon(memberId, couponId, client);
        if(member_coupon != null) {
          throw new BadRequestException("ALREADY_HAVING_COUPON");
        }
    
        await this.deductCouponStock({couponId}, client);
        return await this.memberCouponRepository.issueCoupon(memberId, couponId, client);
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("쿠폰 발행 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async useCoupon(command: UseCouponCommand, txc?: Prisma.TransactionClient): Promise<UseCouponResult> {
    const memberId = command.memberId;
    const couponId = command.couponId;
    const amount = command.amount;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const member_coupon = await this.memberCouponRepository.getCouponsByIdAndMember(couponId, memberId, client);
        if(member_coupon == null) {
          throw new NotFoundException("NOT_FOUND_MEMBER_COUPON");
        }
        if(member_coupon.isUsed) {
          throw new BadRequestException("ALREADY_USED_COUPON");
        }

        let discountedAmount = 0;
        if (member_coupon.coupon.type == "FLAT") {
          if (member_coupon.coupon.offFigure > amount){
            throw new BadRequestException("CANT_USE_COUPON")
          } 
          else {
            discountedAmount = amount - member_coupon.coupon.offFigure;
          }
        } 
        else if (member_coupon.coupon.type == "PERCENTAGE") {
          discountedAmount = (amount * (100 - member_coupon.coupon.offFigure) / 100) | 0;
        }

        const usedMember_coupon = await this.memberCouponRepository.useCoupon(memberId, couponId, client);

        return { coupon: usedMember_coupon.coupon, discountedAmount };
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("쿠폰 사용 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async addCouponStock(command: AddCouponCommand, txc?: Prisma.TransactionClient): Promise<CouponResult> {
    const couponId = command.couponId;


    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const coupon = await this.couponRepository.findByIdWithPessimisticLock(couponId, client);
        if(coupon == null) {
          throw new NotFoundException("NOT_FOUND_COUPON");
        }
        if(coupon.stock == 2_147_483_647) {
          throw new BadRequestException("OVER_COUPON_STOCK_LIMIT")
        }
    
        return await this.couponRepository.addCoupon(couponId, client);
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("쿠폰 재고 추가 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async deductCouponStock(command: DeductCouponCommand, txc?: Prisma.TransactionClient): Promise<CouponResult> {
    const couponId = command.couponId;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const coupon = await this.couponRepository.findByIdWithPessimisticLock(couponId, client);
        if(coupon == null) {
          throw new NotFoundException("NOT_FOUND_COUPON");
        }
        if(coupon.stock == 0) {
          throw new BadRequestException("NOT_ENOUTH_STOCK")
        }
    
        return await this.couponRepository.deductCoupon(couponId, client);
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("쿠폰 재고 차감 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async getCouponsByMember(command: GetCouponsByMemberCommand, txc?: Prisma.TransactionClient): Promise<MemberCouponResult[]> {
    const memberId = command.memberId;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        return await this.memberCouponRepository.getCouponsByMember(memberId, client);
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("보유 쿠폰 조회 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  // async getCouponsByMemberV2(command: GetCouponsByMemberCommand, txc?: Prisma.TransactionClient): Promise<MemberCouponResult[]> {
  //   const memberId = command.memberId;

  //   return await this.transactionService.executeInTransaction(async (tx) => {
  //     const client = txc ?? tx;

  //     return await this.memberCouponIndexRepository.getCouponsByMember(memberId, client);
  //   });
  // }
}
