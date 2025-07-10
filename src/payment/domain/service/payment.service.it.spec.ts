import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "@app/database/prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { PaymentService } from "./payment.service";
import { IPAYMENT_REPOSITORY } from "../repository/payment.repository.interface";
import { PaymentRepository } from "@app/payment/infrastructure/payment.repository";
import { ProcessPaymentCommand } from "../dto/process-payment.command.dto";
import { PaymentResult } from "../dto/payment.result.dto";
import { PaymentStatus } from "../dto/payment-status.enum";

describe("PaymentService Integration Test (with Testcontainers + Prisma)", () => {
  let paymentService: PaymentService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        TransactionService,
        PaymentService,
        {
          provide: IPAYMENT_REPOSITORY,
          useClass: PaymentRepository,
        },
      ],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    const importSqlPath = path.resolve(__dirname, "integration-test-util/import.sql");
    const sql = fs.readFileSync(importSqlPath, "utf8");

    // 여러 SQL 문장을 실행할 수 있도록 분리
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }
  });

  afterEach(async () => {
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.member_Coupon.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.coupon.deleteMany({});
  });

  describe("processPayment", () => {
    it("이미 결제 정보가 존재하는 주문 식별자 1을 결제하려 하면 'ALREADY_PREOCESSED' 메시지와 함께 에러 발생❌", async () => {
      const processPaymentCommand: ProcessPaymentCommand = {
        orderId: 1,
        couponId: undefined,
        memberId: 1,
        approved_at: new Date(),
        amount: 2400000,
      };

      await expect(paymentService.processPayment(processPaymentCommand)).rejects.toThrow("ALREADY_PREOCESSED");
    });

    it("주문 식별자 2를 결제하면 정상적으로 처리 됨 ", async () => {
      const processPaymentCommand: ProcessPaymentCommand = {
        orderId: 2,
        couponId: 1,
        memberId: 1,
        approved_at: new Date(),
        amount: 69000,
      };

      const predictResult: PaymentResult = {
        id: expect.any(Number),
        orderId: 2,
        couponId: 1,
        memberId: 1,
        approved_at: expect.any(Date),
        paid_amount: 69000,
        status: PaymentStatus.PAYMENT_COMPLETED,
      };

      const result = await paymentService.processPayment(processPaymentCommand);

      expect(result).toEqual(predictResult);
    });
  });
});
