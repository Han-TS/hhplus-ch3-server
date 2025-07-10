import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@app/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { TransactionService } from '@app/database/prisma/transaction.service';
import { ProductSalesStatService } from './productSalesStat.service';
import { IPRODUCT_SALES_STAT_REPOSITORY } from '../repository/product_sales_stat.interface.repository';
import { ProductSalesStatRepository } from '@app/productSalesStat/infrastructure/product_sales_stat.repository';
import { AddProductSalesStatCommand, PaidProduct } from '../dto/add-product-sales-stat.command.dto';
import { CacheService } from '@app/redis/redisCache.service';
import { RedisService } from '@app/redis/redis.service';

describe('ProductSalesStatService Integration Test (with Testcontainers + Prisma)', () => {
  let productSalesStatService: ProductSalesStatService;
  let prisma: PrismaService;
  let cacheService: CacheService;
  let redis: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        TransactionService,
        ProductSalesStatService,
        {
          provide: IPRODUCT_SALES_STAT_REPOSITORY,
          useClass: ProductSalesStatRepository,
        },
        RedisService,
        CacheService
      ],
    }).compile();

    productSalesStatService = module.get<ProductSalesStatService>(ProductSalesStatService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);

    redis = module.get<RedisService>(RedisService);
    redis.onModuleInit();
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
    await cacheService.flushAll();
  })

  describe("getPopularProducts", () => {
    it("D-1 ~ D-3 간의 판매량이 많은 순으로 5개의 상품을 내림차순으로 조회함", async () => {
      const predictResult = [
        { rank: 1, productId: 2, productName: '애플 맥세이프 충전기 20W', amount: 1239, sales: 2 },
        { rank: 2, productId: 5, productName: '미니 향균 티슈 250매', amount: 1000, sales: 1 },
        { rank: 3, productId: 3, productName: '무지 라운드넥 반팔티 Free(M/W)', amount: 440, sales: 2 },
        { rank: 4, productId: 1, productName: '다이슨 에어랩', amount: 275, sales: 3 },
        { rank: 5, productId: 4, productName: '안경닦이 100x100', amount: 223, sales: 2 },
      ]

      const result = await productSalesStatService.getPopularProducts();

      expect(result).toEqual(predictResult);
    })
  })

  describe("addProductSalesStat", () => {
    it("여러 상품에 대한 판매 내역의 반영을 요청하면 실제 총 판매액을 반환함", async () => {
      const paidProducts: PaidProduct[] = [
        { productId: 1, productName: "다이슨 에어랩", total_amount: 1, total_sales: 1200000 },
        { productId: 2, productName: "애플 맥세이프 충전기 20W", total_amount: 10, total_sales: 790000 },
        { productId: 7, productName: "모나미 볼펜 12자루", total_amount: 1000, total_sales: 5900000 },
      ];
      const today = new Date();
      let todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      todayDate = new Date(todayDate.getTime() + 9 * 60 * 60 * 1000);
      const command: AddProductSalesStatCommand = { salesDate: todayDate, paidProducts };

      const result = await productSalesStatService.addProductSalesStat(command);

      const afterStat1 = await prisma.product_Sales_Stat.findUnique({where: {id: 15}});
      const afterStat2 = await prisma.product_Sales_Stat.findUnique({where: {id: 14}});
      const afterStat3 = await prisma.product_Sales_Stat.findUnique({where: {id: 16}});

      expect(result.total_sales).toBe(7890000);
      expect(afterStat1.total_amount).toBe(1001);
      expect(afterStat2.total_amount).toBe(47);
      expect(afterStat3.total_amount).toBe(1000);
    })
  })
});
