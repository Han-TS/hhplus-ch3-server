import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@app/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { TransactionService } from '@app/database/prisma/transaction.service';
import { PaymentFacade } from './payment.facade';
import { ProcessPaymentFacadeReqDto } from './dto/process-payment.facade.req.dto';
import { PaymentService } from '../domain/service/payment.service';
import { IPAYMENT_REPOSITORY } from '../domain/repository/payment.repository.interface';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { MemberModule } from '@app/member/member.module';
import { OrderModule } from '@app/order/order.module';
import { ProductModule } from '@app/product/product.module';
import { CouponModule } from '@app/coupon/coupon.module';
import { ProductSalesStatModule } from '@app/productSalesStat/productSalesStat.module';
import { RedisService } from '@app/redis/redis.service';
import { DistributedLockService } from '@app/redis/redisDistributedLock.service';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';

describe('PaymentFacade Integration Test (with Testcontainers + Prisma)', () => {
  let module: TestingModule;
  let paymentFacade: PaymentFacade;
  let prisma: PrismaService;
  let transactionService: TransactionService;
  let lockService: DistributedLockService;
  let redis: RedisService;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    jest.setTimeout(30000);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MemberModule, 
        OrderModule, 
        ProductModule, 
        CouponModule, 
        ProductSalesStatModule,
        EventEmitterModule.forRoot()
      ],
      providers: [
        PrismaService,
        TransactionService,
        PaymentService,
        PaymentFacade,
        {
          provide: IPAYMENT_REPOSITORY,
          useClass: PaymentRepository,
        },
        RedisService,
        DistributedLockService,
      ],
    }).compile();

    transactionService = module.get<TransactionService>(TransactionService);
    paymentFacade = module.get<PaymentFacade>(PaymentFacade);
    prisma = module.get<PrismaService>(PrismaService);

    lockService = module.get<DistributedLockService>(DistributedLockService);
    (paymentFacade as any).lockService = lockService;
    redis = module.get<RedisService>(RedisService);
    redis.onModuleInit();

    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterAll(async() => {
    redis.onModuleDestroy();
  })

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
    await prisma.product_Sales_Stat.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.order_Product.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.member_Coupon.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.balance_History.deleteMany({});
    await prisma.member.deleteMany({});
  })

  describe("processPayment", () => {
    it("주문 식별자 1에 대해서 결제 처리할 경우 모든 데이터들이 정상 반영됨을 확인", async () => {
      const processPaymentReqDto: ProcessPaymentFacadeReqDto = {
        orderId: 2,
        memberId: 1,
        couponId: 1
      }

      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      const result = await paymentFacade.processPayment(processPaymentReqDto);

      const afterMember = await prisma.member.findUnique({
        where: { id: processPaymentReqDto.memberId }
      })
      const afterCoupon = await prisma.member_Coupon.findUnique({
        where: { id: processPaymentReqDto.couponId }
      })
      const afterProducts = await prisma.product.findMany({});
      const afterOrder = await prisma.order.findUnique({
        where: { id: processPaymentReqDto.orderId }
      })

      expect(result.status).toBe("결제완료");
      expect(result.couponId).toBe(1);
      expect(result.paid_amount).toBe(318000);

      expect(afterMember.balance).toBe(10000);

      expect(afterCoupon.isUsed).toBe(true);

      expect(afterProducts[1].stock).toBe(1);
      expect(afterProducts[2].stock).toBe(5);

      expect(afterOrder.status).toBe("결제완료")

      expect(emitSpy).toHaveBeenCalledWith('pay.completed', expect.objectContaining({
        order: expect.objectContaining({
          id: processPaymentReqDto.orderId
        })
      }));
    })

    it("주문 식별자 2에 결제 처리 중에 에러가 생겼을 경우 모든 커밋이 반영되지 않고 rollback 됨을 확인", async () => {
      const processPaymentReqDto: ProcessPaymentFacadeReqDto = {
        orderId: 2,
        memberId: 1,
        couponId: 1
      }

      let result;
      try {
        await transactionService.executeInTransaction(async (tx) => {
          result = await paymentFacade.processPayment(processPaymentReqDto, tx);

          throw new Error();
        })
      } catch(error) {
        //transaction 을 통해 데이터들이 자동으로 롤백될 것임.
      }

      const afterPayment = await prisma.payment.findUnique({
        where: { id: result.id }
      })
      const afterMember = await prisma.member.findUnique({
        where: { id: processPaymentReqDto.memberId }
      })
      const afterCoupon = await prisma.member_Coupon.findUnique({
        where: { id: processPaymentReqDto.couponId }
      })
      const afterProducts = await prisma.product.findMany({});
      const afterOrder = await prisma.order.findUnique({
        where: { id: processPaymentReqDto.orderId }
      })

      expect(afterPayment).toBe(null);

      expect(afterMember.balance).toBe(328000);

      expect(afterCoupon.isUsed).toBe(false);

      // TODO - Kafka 연동 시 해결할 부분
      // expect(afterProducts[1].stock).toBe(2);
      // expect(afterProducts[2].stock).toBe(15);
      // 재고에 대한 트랜잭션은 분리되었으므로 자동으로 롤백되지 못함.
      // 재고를 위한 보상 트랜잭션을 발행해야 함. 이것은 Kafka 연동 후 진행할 수 있을 것.

      expect(afterOrder.status).toBe("결제준비")
    })
  })
});
