import { BadRequestException, HttpException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ProductResult } from "../dto/product.result.dto";
import { GetProductCommand } from "../dto/get-product.command.dto";
import { AddStockCommand } from "../dto/add-stock.command.dto";
import { DeductStockCommand } from "../dto/deduct-stock.command.dto";
import { ProductRepository } from "../../infrastructure/product.repository";
import { Prisma, Product } from "@prisma/client";
import { IPRODUCT_REPOSITORY } from "../repository/product.repository.interface";
import { TransactionService } from "@app/database/prisma/transaction.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { DistributedMultiLockWithArray } from "@app/redis/redisDistributedLock.decorator";
import { DistributedLockService } from "@app/redis/redisDistributedLock.service";

@Injectable()
export class ProductService {
  constructor(
    @Inject(IPRODUCT_REPOSITORY)
    protected readonly productRepository: ProductRepository,
    private readonly transactionService: TransactionService,
    private readonly lockService: DistributedLockService,
  ) {}

  async getAllProducts(txc?: Prisma.TransactionClient): Promise<ProductResult[]> {
    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        return await this.productRepository.findAll(client);
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("상품 조회 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async getProduct(command: GetProductCommand, txc?: Prisma.TransactionClient): Promise<ProductResult> {
    const productId = command.productId;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const result: Product = await this.productRepository.findById(productId, client);
        if (result === null) {
          throw new NotFoundException("PRODUCT_NOT_FOUND");
        }

        return result;
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("상품 정보 조회 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async addProductStock(command: AddStockCommand, txc?: Prisma.TransactionClient): Promise<ProductResult> {
    const productId = command.productId;
    const amount = command.amount;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const product: Product = await this.productRepository.findByIdWithPessimisticLock(productId, client);
        if (product === null) {
          throw new NotFoundException("PRODUCT_NOT_FOUND");
        }
        if (product.stock + amount > 2_147_483_647) {
          throw new BadRequestException("OVER_STOCK_LIMIT");
        }

        const result: Product = await this.productRepository.updateStock(productId, product.stock + amount, client);

        return result;
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("상품 재고 충전 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  async deductProductStock(command: DeductStockCommand, txc?: Prisma.TransactionClient): Promise<ProductResult> {
    const productId = command.productId;
    const amount = command.amount;

    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        const product: Product = await this.productRepository.findByIdWithPessimisticLock(productId, client);

        if (product === null) {
          throw new NotFoundException("PRODUCT_NOT_FOUND");
        }
        if (product.stock < amount) {
          throw new BadRequestException("NOT_ENOUGH_STOCK");
        }

        const result: Product = await this.productRepository.updateStock(productId, product.stock - amount, client);

        return result;
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("상품 재고 차감 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  @DistributedMultiLockWithArray((commands: DeductStockCommand[]) => commands.map((command) => `lock:product:${command.productId}`))
  async deductProductStockBulk(commands: DeductStockCommand[], txc?: Prisma.TransactionClient): Promise<number> {
    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        let result = 0;
        for(const command of commands) {
          const deductedProduct = await this.deductProductStock(command, client);
          result += deductedProduct.price * command.amount;
        }

        return result;
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("상품 재고 차감 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }

  @DistributedMultiLockWithArray((commands: DeductStockCommand[]) => commands.map((command) => `lock:product:${command.productId}`))
  async deductProductStockBulk_rollback(commands: DeductStockCommand[], txc?: Prisma.TransactionClient): Promise<number> {
    return await this.transactionService.executeInTransaction(async (tx) => {
      const client = txc ?? tx;

      try {
        let result = 0;
        for(const command of commands) {
          const addStockCommand: AddStockCommand = { productId: command.productId, amount: command.amount }
          const addedProduct = await this.addProductStock(addStockCommand, client);
          result += addedProduct.price * command.amount;
        }

        return result;
      } catch (error) {
        if(error instanceof HttpException || error instanceof PrismaClientKnownRequestError) {
          throw error;
        } else {
          throw new Error("상품 재고 차감에 대한 롤백 중 예기치 못한 문제가 발생하였습니다. 관리자에게 문의해주세요.")
        }
      }
    });
  }
}
