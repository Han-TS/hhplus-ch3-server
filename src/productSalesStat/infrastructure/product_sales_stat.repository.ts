import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { PrismaService } from "@app/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { IProductSalesStatRepository } from "../domain/repository/product_sales_stat.interface.repository";
import { Prisma, Product_Sales_Stat } from "@prisma/client";

@Injectable()
export class ProductSalesStatRepository
  extends PrismaRepository<Product_Sales_Stat>
  implements IProductSalesStatRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.product_Sales_Stat);
  }
  
  async findStatWithPessimisticLock(salesDate: Date, productId: number, tx: Prisma.TransactionClient): Promise<Product_Sales_Stat[]> {
    const client = tx ?? this.prisma;

    const salesDateString = salesDate
      .toISOString()
      .split("T")[0];

    const result = await client.$queryRawUnsafe<Product_Sales_Stat[]>(`
      SELECT * FROM Product_Sales_Stat WHERE salesDate='${salesDateString}' AND productId=${productId} FOR UPDATE;`);

    return result;
  }

  async getTop5ProductByAmountLast3Days(tx?: Prisma.TransactionClient): Promise<
    { rank: number; productId: number; productName: string; amount: number; sales: number }[]
  > {
    const client = tx ?? this.prisma;

    return await client.$queryRaw<
      { rank: number; productId: number; productName: string; amount: number; sales: number }[]
    >`
      SELECT 
        CONVERT(RANK() OVER (ORDER BY amount DESC), CHAR) AS \`rank\`,
        productId,
        productName,
        amount,
        sales
      FROM (
        SELECT 
          productId,
          productName,
          SUM(total_amount) AS amount,
          SUM(total_sales) AS sales
        FROM Product_Sales_Stat
        WHERE salesDate >= CURDATE() - INTERVAL 3 DAY
          AND salesDate < CURDATE()
        GROUP BY productId, productName
      ) AS ranked
      ORDER BY amount DESC
      LIMIT 5;
    `;
  }
}
