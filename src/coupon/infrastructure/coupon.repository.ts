import { PrismaRepository } from "@app/database/prismaRepository.impl"
import { Coupon, Prisma } from "@prisma/client";
import { ICouponRepository } from "../domain/repository/coupon.repository.interface";
import { PrismaService } from "@app/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CouponRepository extends PrismaRepository<Coupon> implements ICouponRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.coupon);
  }

  async findByIdWithPessimisticLock(couponId: number, tx: Prisma.TransactionClient): Promise<Coupon | null> {
    // TODO - 해당 내용 보고서에 기재
    // MySQL 에서 기본적으로 Lock Wait Timeout 이 50s
    // 하지만 쿠폰의 경우 한 명이 발급 받는데 1초가 걸린다고 생각했을 때, 1000개를 동시 발급 받으려 하면 1000s 를 대기하는 client 가 있을 수 있음.
    // 이것 뿐만 아니라 MySQL 에서 동시에 접근 가능한 connection 갯수를 기본 151개로 제한하고 있기 때문에 이 또한 변경해주어야 함.
    await tx.$executeRawUnsafe(`SET innodb_lock_wait_timeout = 3600`);

    const result = await tx.$queryRawUnsafe<Coupon[]>(
      `SELECT * FROM Coupon WHERE id = ${couponId} FOR UPDATE`
    )

    return result[0] ?? null;
  }

  async getAllAvailableCoupons(tx?: Prisma.TransactionClient): Promise<Coupon[]> {
    const client = tx ?? this.prisma;

    return await client.coupon.findMany({
      where: {
        stock: { gt: 0 },
      },
    })
  }

  async addCoupon(couponId: number, tx?: Prisma.TransactionClient): Promise<Coupon> {
    const client = tx ?? this.prisma;

    return await client.coupon.update({
      where: { id: couponId },
      data: {
        stock: {
          increment: 1
        }
      }
    })
  }

  async deductCoupon(couponId: number, tx?: Prisma.TransactionClient): Promise<Coupon> {
    const client = tx ?? this.prisma;
    
    return await client.coupon.update({
      where: { id: couponId },
      data: {
        stock: {
          decrement: 1
        }
      }
    })
  }

  async updateCouponStock(couponId: number, stock: number, tx?: Prisma.TransactionClient): Promise<Coupon> {
    const client = tx ?? this.prisma;

    const coupon = await this.findById(couponId, client);
    return await this.updateById(
      couponId, 
      {
        stock
      }, 
      client
    )
  }
}