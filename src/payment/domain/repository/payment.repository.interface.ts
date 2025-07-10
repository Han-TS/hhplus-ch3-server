import { IRepository } from "@app/database/repository.interface";
import { Payment, Prisma } from "@prisma/client";
import { PaymentStatus } from "../../domain/dto/payment-status.enum";

export interface IPaymentRepository extends IRepository<Payment> {
  createPayment(
    orderId: number,
    couponId: number,
    memberId: number,
    paid_amount: number,
    approved_at: Date,
    status: PaymentStatus,
    tx?: Prisma.TransactionClient
  ): Promise<Payment>;
}

export const IPAYMENT_REPOSITORY = Symbol("IPAYMENT_REPOSITORY");
