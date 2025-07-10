import { BadRequestException, HttpException, Inject, Injectable } from "@nestjs/common";
import { ICOUPON_REPOSITORY } from "../repository/coupon.repository.interface";
import { IMEMBER_COUPON_REPOSITORY } from "../repository/member_coupon.repository.interface";
import { CouponRepository } from "@app/coupon/infrastructure/coupon.repository";
import { MemberCouponRepository } from "@app/coupon/infrastructure/member_coupon.repository";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { CouponResult } from "../dto/coupon.result.dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { IssueCouponCommand } from "../dto/issue-coupon.command.dto";
import { UseCouponCommand } from "../dto/use-coupon.command.dto";
import { UseCouponResult } from "../dto/use-coupon.result.dto";
import { ICOUPON_REDIS_REPOSITORY } from "../repository/coupon.redis.repository.interface";
import { CouponRedisRepository } from "@app/coupon/infrastructure/coupon.redis.repository";
import { DistributedLock } from "@app/redis/redisDistributedLock.decorator";
import { KafkaEventPublisherService } from "@app/kafka/kafka-event-publisher.service";
import { IssueCouponRequstedEvent } from "@app/common/events/issue-coupon-requested.event";

@Injectable()
export class CouponRedisService {
  constructor(
    @Inject(ICOUPON_REPOSITORY)
    private readonly couponRepository: CouponRepository,
    @Inject(IMEMBER_COUPON_REPOSITORY)
    private readonly memberCouponRepository: MemberCouponRepository,
    // @Inject(IMEMBER_COUPON_INDEX_REPOSITORY)
    // private readonly memberCouponIndexRepository: MemberCouponIndexRepository,
    private readonly transactionService: TransactionService,
    @Inject(ICOUPON_REDIS_REPOSITORY)
    private readonly couponRedisRepoistory: CouponRedisRepository, 
    private readonly kafkaPublisher: KafkaEventPublisherService
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

  async enrollCouponStock(couponId: number, stock: number): Promise<void> {
    await this.couponRedisRepoistory.enrollCouponStock(couponId, stock);

    return;
  }

  async requestIssueCoupon(command: IssueCouponCommand, txc?: Prisma.TransactionClient): Promise<void> {
    const couponId = command.couponId;
    const memberId = command.memberId;

    const topic = 'issue.coupon.requested';
    const key = couponId.toString();

    let outboxId: number= -1;
    await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      const result = await client.outbox.create({
        data: {
          topic,
          key,
          value: { couponId, memberId },
          status: 'init', // enum 생략 가능
        },
      });
      outboxId = result.id;
    });

    const value = JSON.stringify(new IssueCouponRequstedEvent(outboxId, couponId, memberId));
    this.kafkaPublisher.publish({ topic, key, value })

    return;
  }
  
  async processIssueCoupon(outboxId: number, couponId: number, memberId: number): Promise<void> {
    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = tx;

      try {
        const outboxStatus = await client.$queryRawUnsafe(
          `SELECT status FROM Outbox WHERE id = ${outboxId} FOR UPDATE`
        )

        if(outboxStatus[0].status != 'init') return;

        await client.outbox.update({
          where: { id: outboxId },
          data: {
            status: 'received'
          }
        });

        const isSuccessed = await this.couponRedisRepoistory.issueCoupon(couponId, memberId);

        await client.outbox.update({
          where: { id: outboxId },
          data: {
            status: 'done'
          }
        });

      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("쿠폰 발급 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
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
        const couponStatus = await this.couponRedisRepoistory.isCouponExists(couponId, memberId);

        if(!couponStatus) {
          throw new BadRequestException("UNAVAILABE_COUPON");
        }

        // DB 에서도 사용 내역 2중 확인
        const member_coupon = await this.memberCouponRepository.getCouponsByIdAndMember(couponId, memberId, client);
        if(member_coupon != null) {
          throw new BadRequestException("UNAVAILABE_COUPON")
        }

        const couponInfo = await this.couponRepository.findById(couponId, client);

        let discountedAmount = 0;
        if (couponInfo.type == "FLAT") {
          if (couponInfo.offFigure > amount){
            throw new BadRequestException("CANT_USE_COUPON")
          } 
          else {
            discountedAmount = amount - couponInfo.offFigure;
          }
        } 
        else if (couponInfo.type == "PERCENTAGE") {
          discountedAmount = (amount * (100 - couponInfo.offFigure) / 100) | 0;
        }

        await this.couponRedisRepoistory.useCoupon(couponId, memberId);
        await this.memberCouponRepository.useCouponV2(memberId, couponId, client);

        return { coupon: couponInfo, discountedAmount };
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("쿠폰 사용 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    })
  }
}