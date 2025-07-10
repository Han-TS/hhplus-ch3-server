import { PrismaService } from "@app/database/prisma/prisma.service";
import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { Injectable } from "@nestjs/common";
import { Payment, Prisma } from "@prisma/client";
import { IPaymentRepository } from "../domain/repository/payment.repository.interface";
import { PaymentStatus } from "../domain/dto/payment-status.enum";

@Injectable()
export class PaymentRepository extends PrismaRepository<Payment> implements IPaymentRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.payment);
  }

  async createPayment(
    orderId: number,
    couponId: number,
    memberId: number,
    paid_amount: number,
    approved_at: Date,
    status: PaymentStatus,
    tx?: Prisma.TransactionClient
  ): Promise<Payment> {
    const client = tx ?? this.prisma;

    return await client.payment.create({
      data: {
        order: { connect: { id: orderId } },
        coupon: { connect: { id: couponId }},
        member: { connect: { id: memberId } },
        paid_amount,
        approved_at,
        status,
      },
    });
  }
}
