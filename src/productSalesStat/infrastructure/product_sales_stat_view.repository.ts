import { PrismaRepository } from "@app/database/prismaRepository.impl";
import { PrismaService } from "@app/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { Prisma, Product_Sales_Stat_View } from "@prisma/client";
import { IProductSalesStatViewRepository } from "../domain/repository/product_sales_stat_view.interface.repository";

@Injectable()
export class ProductSalesStatViewRepository
  extends PrismaRepository<Product_Sales_Stat_View>
  implements IProductSalesStatViewRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, (client) => client.product_Sales_Stat_View);
  }

  async getTop5ProductByAmountLast3Days(tx?: Prisma.TransactionClient): Promise<
    { rank: number; productId: number; productName: string; amount: number; sales: number }[]
  > {
    const client = tx ?? this.prisma;

    return await client.$queryRaw<
      { rank: number; productId: number; productName: string; amount: number; sales: number }[]
    >`
      SELECT 
        \`rank\`, 
        productId, 
        productName, 
        total_amount as amount, 
        total_sales as sales 
        FROM Product_Sales_Stat_View 
        WHERE date = CURDATE() 
        ORDER BY \`rank\`;
    `;
  }
}
