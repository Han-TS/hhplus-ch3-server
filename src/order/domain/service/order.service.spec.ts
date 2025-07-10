import { Test, TestingModule } from "@nestjs/testing";
import { OrderService } from "./order.service";
import { IORDER_REPOSITORY } from "../repository/order.repository.interface";
import { IORDER_PRODUCT_REPOSITORY } from "../repository/order_product.repository.interface";
import { OrderProductCommand } from "../dto/order-product.command.dto";
import { CancelOrderCommand } from "../dto/cancel-order.command.dto";
import { OrderStatus } from "../dto/order-status.enum";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { PayOrderCommand } from "../dto/pay-order.command.dto";
import { OrderResult } from "../dto/order.result.dto";

jest.mock("@app/common/enum.common", () => ({
  getEnumFromValue: (_enum: any, value: string) => value,
}));

describe("OrderService", () => {
  let orderService: OrderService;
  let transactionStub: any;
  let orderRepository: any;
  let orderProductRepository: any;

  beforeEach(async () => {
    transactionStub = {
      executeInTransaction: jest.fn((cb) => cb({})),
    };

    orderRepository = {
      createOrder: jest.fn(),
      findById: jest.fn(),
      paymentCompleteOrder: jest.fn(),
      cancelOrder: jest.fn(),
      getOrder: jest.fn(),
    };

    orderProductRepository = {
      createOrderProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: TransactionService, useValue: transactionStub },
        { provide: IORDER_REPOSITORY, useValue: orderRepository },
        { provide: IORDER_PRODUCT_REPOSITORY, useValue: orderProductRepository },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
  });

  describe("orderProduct", () => {
    it("주문 및 주문상품 등록이 정상적으로 수행되어야 함 ", async () => {
      const command: OrderProductCommand = {
        memberId: 1,
        products: [
          { id: 101, price: 1000, amount: 2 },
          { id: 102, price: 2000, amount: 1 },
        ],
      };

      const mockOrder = {
        id: 1,
        memberId: 1,
        totalSales: 4000,
        status: "결제준비",
      };

      orderRepository.createOrder.mockResolvedValue(mockOrder);

      const result = await orderService.orderProduct(command);

      expect(result).toEqual({
        id: 1,
        memberId: 1,
        totalSales: 4000,
        status: "결제준비",
      });

      expect(orderRepository.createOrder).toHaveBeenCalledWith(1, 4000, OrderStatus.PAYMENT_PREPARING, {});
      expect(orderProductRepository.createOrderProduct).toHaveBeenCalledTimes(2);
      expect(orderProductRepository.createOrderProduct).toHaveBeenCalledWith(1, 101, 2, {});
      expect(orderProductRepository.createOrderProduct).toHaveBeenCalledWith(1, 102, 1, {});
    });
  });

  describe("payOrder", () => {
    it("주문에 대해서 결제 완료 상태로 변경함 ", async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 1,
        memberId: 1,
        totalSales: 2400000,
        status: "결제준비",
      });
      (orderRepository.paymentCompleteOrder as jest.Mock).mockResolvedValue({
        id: 1,
        memberId: 1,
        totalSales: 2400000,
        status: "결제완료",
      });

      const predictResult: OrderResult = {
        id: 1,
        memberId: 1,
        totalSales: 2400000,
        status: OrderStatus.PAYMENT_COMPLETED,
      };

      const payOrderCommand: PayOrderCommand = {
        orderId: 1,
      };

      const result = await orderService.payOrder(payOrderCommand);

      expect(result).toEqual(predictResult);
      expect(orderRepository.findById).toHaveBeenCalledTimes(1);
      expect(orderRepository.findById).toHaveBeenCalledWith(1, {});
      expect(orderRepository.paymentCompleteOrder).toHaveBeenCalledTimes(1);
      expect(orderRepository.findById).toHaveBeenCalledWith(1, {});
    });

    it("존재하지 않는 주문을 결제 완료하려 하면 'ORDER_NOT_FOUND' 메시지와 함께 에러 발생❌", async () => {
      orderRepository.findById.mockResolvedValue(null);

      const command: PayOrderCommand = { orderId: 999 };

      await expect(orderService.payOrder(command)).rejects.toThrow("ORDER_NOT_FOUND");
      expect(orderRepository.paymentCompleteOrder).not.toHaveBeenCalled();
    });

    it("결제준비 상태가 아닌 주문을 결제 완료하려 하면 'CANT_PAY_ORDER' 메시지와 함께 에러 발생❌", async () => {
      (orderRepository.findById as jest.Mock).mockResolvedValue({
        id: 1,
        memberId: 1,
        totalSales: 2400000,
        status: "결제완료",
      });

      const command: PayOrderCommand = { orderId: 1 };

      await expect(orderService.payOrder(command)).rejects.toThrow("CANT_PAY_ORDER");
      expect(orderRepository.paymentCompleteOrder).not.toHaveBeenCalled();
    });
  });

  describe("cancelOrder", () => {
    it("존재하지 않는 주문을 취소하려 하면 'ORDER_NOT_FOUND' 메시지와 함께 에러 발생❌", async () => {
      orderRepository.findById.mockResolvedValue(null);

      const command: CancelOrderCommand = { orderId: 999 };

      await expect(orderService.cancelOrder(command)).rejects.toThrow("ORDER_NOT_FOUND");
      expect(orderRepository.cancelOrder).not.toHaveBeenCalled();
    });

    it("존재하는 주문을 취소하면 정상적으로 수행되어야 함 ", async () => {
      const command: CancelOrderCommand = { orderId: 1 };

      const mockBeforeCancel = {
        id: 1,
        memberId: 10,
        totalSales: 5000,
        status: "결제준비",
      };

      const mockAfterCancel = {
        id: 1,
        memberId: 10,
        totalSales: 5000,
        status: "주문취소",
      };

      orderRepository.findById.mockResolvedValue(mockBeforeCancel);
      orderRepository.cancelOrder.mockResolvedValue(mockAfterCancel);

      const result = await orderService.cancelOrder(command);

      expect(result).toEqual({
        id: 1,
        memberId: 10,
        totalSales: 5000,
        status: "주문취소",
      });

      expect(orderRepository.findById).toHaveBeenCalledWith(1, {});
      expect(orderRepository.cancelOrder).toHaveBeenCalledWith(1, {});
    });
  });

  describe("getOrder", () => {
    it("주문 ID를 통해 주문 및 상품 정보를 조회할 수 있어야 함 ", async () => {
      const mockOrder = {
        id: 3,
        memberId: 42,
        totalSales: 8000,
        status: "결제완료",
        orderProducts: [
          {
            id: 10,
            productId: 200,
            amount: 1,
            product: {
              id: 200,
              name: "테스트 상품",
              price: 8000,
            },
          },
        ],
      };

      orderRepository.getOrder.mockResolvedValue(mockOrder);

      const result = await orderService.getOrder({ orderId: 3 });

      expect(result).toEqual(mockOrder);
      expect(orderRepository.getOrder).toHaveBeenCalledWith(3, {});
    });
  });
});
