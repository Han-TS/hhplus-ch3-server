import { Test, TestingModule } from "@nestjs/testing";
import { IPRODUCT_SALES_STAT_REDIS_REPOSITORY } from "../repository/product_sales_stat.redis.interface.repository";
import { ProductSalesStatRedisService } from "./productSalesStat.redis.service";
import { AddProductSalesStatCommand, PaidProduct } from "../dto/add-product-sales-stat.command.dto";

describe("ProductSalesStatService", () => {
  let productSalesStatRedisService: ProductSalesStatRedisService;
  let productSalesStatRedisRepositoryStub: any;

  let mockPopularProducts = [
    { productId: 1, amount: 1200000 },
    { productId: 7, amount: 5900000 },
    { productId: 2, amount: 790000 },
    { productId: 4, amount: 550000 },
    { productId: 8, amount: 430000 },
  ];

  beforeEach(async () => {
    productSalesStatRedisRepositoryStub = {
      recordSales: jest.fn(),
      getTop5ProductByScore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSalesStatRedisService,
        { provide: IPRODUCT_SALES_STAT_REDIS_REPOSITORY, useValue: productSalesStatRedisRepositoryStub },
      ],
    }).compile();

    productSalesStatRedisService = module.get<ProductSalesStatRedisService>(ProductSalesStatRedisService);
  });

  it("should be defined", () => {
    expect(productSalesStatRedisService).toBeDefined();
  });

  describe("addProductSalesStat", () => {
    it("3개의 상품에 대한 통계 반영 요청을 하면 요청한 상품들의 지불 총액을 반환하여야 함 ", async () => {
      // dto settings
      const paidProducts: PaidProduct[] = [
        { productId: 1, productName: "다이슨 에어랩", total_amount: 1, total_sales: 1200000 },
        { productId: 2, productName: "애플 맥세이프 충전기 20W", total_amount: 10, total_sales: 790000 },
        { productId: 7, productName: "모나미 볼펜 12자루", total_amount: 1000, total_sales: 5900000 },
      ];
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const command: AddProductSalesStatCommand = { salesDate: todayDate, paidProducts };

      // real service calls
      const result = await productSalesStatRedisService.addProductSalesStat(command);

      // expectations
      expect(result.total_sales).toBe(7890000);
      expect(productSalesStatRedisRepositoryStub.recordSales).toHaveBeenCalledTimes(3);
      expect(productSalesStatRedisRepositoryStub.recordSales).toHaveBeenNthCalledWith(1, todayDate, paidProducts[0]);
      expect(productSalesStatRedisRepositoryStub.recordSales).toHaveBeenNthCalledWith(2, todayDate, paidProducts[1]);
      expect(productSalesStatRedisRepositoryStub.recordSales).toHaveBeenNthCalledWith(3, todayDate, paidProducts[2]);
    });
  });

  describe("getPopularProducts", () => {
    it("mock으로 등록된 통계 정보가 조회되어야 함 ", async () => {
      // mock & stub settings
      productSalesStatRedisRepositoryStub.getTop5ProductByScore.mockResolvedValue(JSON.stringify(mockPopularProducts));

      // real service calls
      const result = await productSalesStatRedisService.getPopularProducts();

      // expectations
      const expectedResult = [
        { rank: 1, productId: 1, amount: 1200000 },
        { rank: 2, productId: 7, amount: 5900000 },
        { rank: 3, productId: 2, amount: 790000 },
        { rank: 4, productId: 4, amount: 550000 },
        { rank: 5, productId: 8, amount: 430000 },
      ];

      expect(result).toEqual(expectedResult);
    });
  });
});
