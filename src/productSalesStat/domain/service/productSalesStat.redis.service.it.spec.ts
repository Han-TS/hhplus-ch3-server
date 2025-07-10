import { Test, TestingModule } from '@nestjs/testing';
import { ProductSalesStatRedisService } from './productSalesStat.redis.service';
import { IPRODUCT_SALES_STAT_REDIS_REPOSITORY } from '../repository/product_sales_stat.redis.interface.repository';
import { ProductSalesStatRedisRepository } from '@app/productSalesStat/infrastructure/product_sales_stat.redis.repository';
import { RedisModule } from '@app/redis/redis.module';
import { AddProductSalesStatCommand, PaidProduct } from '../dto/add-product-sales-stat.command.dto';
import { RedisService } from '@app/redis/redis.service';

describe('ProductSalesStatRedisService Integration Test (with Testcontainers + Redis)', () => {
  let productSalesStatRedisService: ProductSalesStatRedisService;
  let redisService: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule],
      providers: [
        ProductSalesStatRedisService,
        {
          provide: IPRODUCT_SALES_STAT_REDIS_REPOSITORY,
          useClass: ProductSalesStatRedisRepository,
        },
      ],
    }).compile();

    productSalesStatRedisService = module.get<ProductSalesStatRedisService>(ProductSalesStatRedisService);
    redisService = module.get<RedisService>(RedisService);

    redisService.onModuleInit();
  });

  afterAll(async () => {
    redisService.onModuleDestroy();
  })

  beforeEach(async () => {
    const redisClient = redisService.getClient();
    const redisKey = `product:sales:top5`;
    const sampleTop5 = [
      { productId: 1, amount: 1200000 },
      { productId: 7, amount: 5900000 },
      { productId: 2, amount: 790000 },
      { productId: 4, amount: 550000 },
      { productId: 8, amount: 430000 }
    ];
    redisClient.set(redisKey, JSON.stringify(sampleTop5), 'EX', 86400);
  })

  afterEach(async() => {
    redisService.getClient().flushall();
  })

  it("should be defined", () => {
    expect(productSalesStatRedisService).toBeDefined();
  });

  describe("getPopularProducts", () => {
    it("Redis 에 저장된 D-3~D-1 일 간의 판매 랭킹 Top5 를 조회함", async () => {
      // real service calls
      const result = await productSalesStatRedisService.getPopularProducts();

      // expectations
      const expectedResult = [
        { rank: 1, productId: 1, amount: 1200000 },
        { rank: 2, productId: 7, amount: 5900000 },
        { rank: 3, productId: 2, amount: 790000 },
        { rank: 4, productId: 4, amount: 550000 },
        { rank: 5, productId: 8, amount: 430000 }
      ];

      expect(result).toEqual(expectedResult);
    })
  })

  describe("addProductSalesStat", () => {
    it("여러 상품에 대한 판매 내역의 반영을 요청하면 실제 총 판매액을 반환함", async () => {
      // dto settings
      const paidProducts: PaidProduct[] = [
        { productId: 1, productName: "다이슨 에어랩", total_amount: 1, total_sales: 1200000 },
        { productId: 2, productName: "애플 맥세이프 충전기 20W", total_amount: 10, total_sales: 790000 },
        { productId: 7, productName: "모나미 볼펜 12자루", total_amount: 1000, total_sales: 5900000 },
      ];
      const today = new Date()
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const command: AddProductSalesStatCommand = { salesDate: todayDate, paidProducts };

      // real service calls
      const result = await productSalesStatRedisService.addProductSalesStat(command);

      // expectations
      const redisClient = redisService.getClient();
      const salesDateString = todayDate.toISOString().split("T")[0];
      const redisKey = `product:salesStat:${salesDateString}`;
      const zrange = await redisClient.zrevrange(redisKey, 0, -1, 'WITHSCORES');

      expect(result.total_sales).toBe(7890000);
      expect(zrange).toEqual([
        "7", "1000",
        "2", "10",
        "1", "1"
      ]);
    })
  })
});
