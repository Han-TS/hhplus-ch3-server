import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@app/database/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { ProductService } from './product.service';
import { ProductRepository } from '@app/product/infrastructure/product.repository';
import { IPRODUCT_REPOSITORY } from '../repository/product.repository.interface';
import { GetProductCommand } from '../dto/get-product.command.dto';
import { AddStockCommand } from '../dto/add-stock.command.dto';
import { DeductStockCommand } from '../dto/deduct-stock.command.dto';
import { TransactionService } from '@app/database/prisma/transaction.service';
import { RedisService } from '@app/redis/redis.service';
import { DistributedLockService } from '@app/redis/redisDistributedLock.service';

describe('ProductService Integration Test (with Testcontainers + Prisma)', () => {
  let productService: ProductService;
  let prisma: PrismaService;
  let lockService: DistributedLockService;
  let redis: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        TransactionService,
        ProductService,
        {
          provide: IPRODUCT_REPOSITORY,
          useClass: ProductRepository,
        },
        RedisService,
        DistributedLockService
      ],
    }).compile();

    productService = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);

    lockService = module.get<DistributedLockService>(DistributedLockService);
    (productService as any).lockService = lockService;
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
    await prisma.product.deleteMany({});
  })

  describe("getAllProducts", () => {
    it("모든 상품을 조회하였을 때, 2개의 상품이 있어야 하며, 각각 id, name, stock, price 값을 제공해야 함", async () => {
      const resultPredict = [
        { id: 1, name: '다이슨 에어랩', stock: 2147483647, price: 1200000 },
        { id: 2, name: '안경닦이 100x100', stock: 0, price: 500 }
      ]
      
      const allProducts = await productService.getAllProducts();

      expect(allProducts.length).toBe(2);
      expect(allProducts).toEqual(resultPredict);
    })
  })

  describe("getProduct", () => {
    it("상품 식별자 1을 조회하면 상품의 이름, 재고, 가격을 제공해야 함", async () => {
      const resultPredict = { id: 1, name: '다이슨 에어랩', stock: 2147483647, price: 1200000 };
      const getProductCommand: GetProductCommand = {
        productId: 1
      }

      const result = await productService.getProduct(getProductCommand);

      expect(result).toEqual(resultPredict);
    })

    it("존재하지 않는 상품 식별자 3을 조회하면 'PRODUCT_NOT_FOUND' 메시지와 함께 에러 발생", async () => {
      const getProductCommand: GetProductCommand = {
        productId: 3
      }

      await expect(productService.getProduct(getProductCommand)).rejects.toThrow("PRODUCT_NOT_FOUND");
    })
  })

  describe("addProductStock", () => {
    it("상품 식별자 1에 재고 1개를 추가하면 'OVER_STOCK_LIMIT' 메시지와 함께 에러 발생", async () => {
      const addStockCommand: AddStockCommand = {
        productId: 1,
        amount: 1
      }

      await expect(productService.addProductStock(addStockCommand)).rejects.toThrow("OVER_STOCK_LIMIT");
    })

    it("상품 식별자 2에 재고 5개를 추가하면 5개의 재고가 있어야 함", async () => {
      const addStockCommand: AddStockCommand = {
        productId: 2,
        amount: 5
      }

      const result = await productService.addProductStock(addStockCommand);

      expect(result.stock).toBe(5);
    })

    it("존재하지 않는 상품 식별자 3에 재고 1개를 추가하면 'PRODUCT_NOT_FOUND' 메시지와 함께 에러 발생", async () => {
      const addStockCommand: AddStockCommand = {
        productId: 3,
        amount: 1
      }

      await expect(productService.addProductStock(addStockCommand)).rejects.toThrow("PRODUCT_NOT_FOUND");
    })
  })

  describe("deductProductStock", () => {
    it("상품 식별자 1에 재고 2147483647개를 차감하면 0개의 재고가 있어야 함", async () => {
      const deductStockCommand: DeductStockCommand = {
        productId: 1,
        amount: 2147483647
      }

      const result = await productService.deductProductStock(deductStockCommand);

      expect(result.stock).toBe(0);
    })

    it("상품 식별자 2에 재고 1개를 차감하면 'NOT_ENOUGH_STOCK' 메시지와 함께 에러 발생", async () => {
      const deductStockCommand: DeductStockCommand = {
        productId: 2,
        amount: 1
      }

      await expect(productService.deductProductStock(deductStockCommand)).rejects.toThrow("NOT_ENOUGH_STOCK");
    })

    it("존재하지 않는 상품 식별자 3에 재고 1개를 차감하면 'PRODUCT_NOT_FOUND' 메시지와 함께 에러 발생", async () => {
      const deductStockCommand: DeductStockCommand = {
        productId: 3,
        amount: 1
      }

      await expect(productService.deductProductStock(deductStockCommand)).rejects.toThrow("PRODUCT_NOT_FOUND");
    })
  })
});
