import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@app/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { IORDER_REPOSITORY } from '../repository/order.repository.interface';
import { OrderRepository } from '@app/order/infrastructure/order.repository';
import { IORDER_PRODUCT_REPOSITORY } from '../repository/order_product.repository.interface';
import { OrderProductRepository } from '@app/order/infrastructure/order_product.repository';
import { OrderService } from './order.service';
import { GetOrderCommand } from '../dto/get-order.command.dto';
import { OrderProductCommand } from '../dto/order-product.command.dto';
import { CancelOrderCommand } from '../dto/cancel-order.command.dto';
import { TransactionService } from '@app/database/prisma/transaction.service';
import { PayOrderCommand } from '../dto/pay-order.command.dto';

describe('OrderService Integration Test (with Testcontainers + Prisma)', () => {
  let orderService: OrderService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        TransactionService,
        OrderService,
        {
          provide: IORDER_REPOSITORY,
          useClass: OrderRepository,
        },
        {
          provide: IORDER_PRODUCT_REPOSITORY,
          useClass: OrderProductRepository,
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
    prisma = module.get<PrismaService>(PrismaService);
  });

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
    await prisma.order_Product.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.member.deleteMany({});
  })

  describe("getOrder", () => {
    it("주문 식별자 1을 조회하면 해당 주문에 대한 정보를 제공 해야함", async () => {
      const predictResult = { 
        id: 1, 
        memberId: 11, 
        totalSales: 2400000, 
        status: "결제준비",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        orderProducts: [
          {
            id: 1,
            orderId: 1,
            productId: 10,
            amount: 2,
            product: {
              id: 10,
              name: '다이슨 에어랩',
              stock: 121,
              price: 1200000
            }
          }
        ]
      };
      const getOrderCommand: GetOrderCommand = {
        orderId: 1
      }

      const result = await orderService.getOrder(getOrderCommand);

      expect(result).toEqual(predictResult);
    })

    it("존재하지 않는 주문 식별자 100을 조회하면 'ORDER_NOT_FOUND' 메시지와 함께 에러 발생", async () => {
      const getOrderCommand: GetOrderCommand = {
        orderId: 100
      }

      await expect(orderService.getOrder(getOrderCommand)).rejects.toThrow("ORDER_NOT_FOUND");
    })
  });

  describe("orderProduct", () => {
    it("새로운 주문을 생성하면 식별자는 3이며, 주문 한 상품들의 총 가격을 계산하여 저장함", async () => {
      const orderProductCommand: OrderProductCommand = {
        memberId: 11,
        products: [
          { id: 11, price: 790000, amount: 1 },
          { id: 14, price: 2500, amount: 10 },
          { id: 16, price: 1000, amount: 10 }
        ]
      }

      const result = await orderService.orderProduct(orderProductCommand);

      expect(result.totalSales).toBe(825000);
    })
  });

  describe("payOrder", () => {
    it("'결제준비' 상태의 주문에 대해서 '결제완료' 상태로 변경하여 저장함", async () => {
      const payOrderCommand: PayOrderCommand = {
        orderId: 1
      }

      const result = await orderService.payOrder(payOrderCommand);

      expect(result.status).toBe("결제완료");
    })

    it("존재하지 않는 주문 식별자 100을 결제 완료하면 'ORDER_NOT_FOUND' 메시지와 함께 에러 발생'", async () => {
      const payOrderCommand: PayOrderCommand = {
        orderId: 100
      }

      await expect(orderService.payOrder(payOrderCommand)).rejects.toThrow("ORDER_NOT_FOUND");
    })

    it("'주문준비' 상태가 아닌 주문 식별자 2을 결제 완료하면 'CANT_PAY_ORDER' 메시지와 함께 에러 발생'", async () => {
      const payOrderCommand: PayOrderCommand = {
        orderId: 2
      }

      await expect(orderService.payOrder(payOrderCommand)).rejects.toThrow("CANT_PAY_ORDER");
    })
  })

  describe("cancelOrder", () => {
    it("주문 식별자 1을 주문 취소하면 해당 주문의 status 를 '주문취소' 로 변경함", async () => {
      const cancelOrderCommand: CancelOrderCommand = {
        orderId: 1
      }

      const result = await orderService.cancelOrder(cancelOrderCommand);

      expect(result.status).toBe("주문취소");
    })

    it("존재하지 않는 주문 식별자 100을 주문 취소하면 'ORDER_NOT_FOUND' 메시지와 함께 에러 발생'", async () => {
      const cancelOrderCommand: CancelOrderCommand = {
        orderId: 100
      }

      await expect(orderService.cancelOrder(cancelOrderCommand)).rejects.toThrow("ORDER_NOT_FOUND");
    })

    it("이미 취소 된 주문 식별자 2를 주문 취소하면 'ALREADY_CANCELED_ORDER' 메시지와 함께 에러 발생", async () => {
      const cancelOrderCommand: CancelOrderCommand = {
        orderId: 2
      }

      await expect(orderService.cancelOrder(cancelOrderCommand)).rejects.toThrow("ALREADY_CANCELED_ORDER");
    })
  });
});
