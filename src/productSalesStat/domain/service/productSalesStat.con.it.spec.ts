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

describe('ProductSalesStatService Concurrency Test', () => {
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
    const importSqlPath = path.resolve(__dirname, 'integration-test-util/import_concurrency.sql');
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

  describe("addProductSalesStat", () => {
    it("상품 식별자 1,2를 5개씩 5번 구매 이력을 추가하면 1은 25개, 2는 기존 판매 포함 30개의 판매 이력이 남아야 함", async () => {
      const today = new Date();
      let todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      todayDate = new Date(todayDate.getTime() + 9 * 60 * 60 * 1000);

      const command: AddProductSalesStatCommand = {
        salesDate: todayDate,
        paidProducts: [
          { productId: 1, productName: "다이슨 에어랩", total_amount: 5, total_sales: 6000000 },
          { productId: 2, productName: "애플 맥세이프 충전기 20W", total_amount: 5, total_sales: 495000 }
        ]
      }

      const result = await Promise.allSettled([
        productSalesStatService.addProductSalesStat(command),
        productSalesStatService.addProductSalesStat(command),
        productSalesStatService.addProductSalesStat(command),
        productSalesStatService.addProductSalesStat(command),
        productSalesStatService.addProductSalesStat(command),
      ])

      const afterStat1 = await prisma.product_Sales_Stat.findUnique({select: {total_amount: true}, where: {id: 1}});
      const afterStat2 = await prisma.product_Sales_Stat.findMany({select: {total_amount: true}, where: {productId: 1}});

      expect(afterStat1.total_amount).toBe(30);
      expect(afterStat2[0].total_amount).toBe(25);
    })
  })
});
