import { PrismaService } from "@app/database/prisma/prisma.service";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class ViewRefreshService {
  private readonly logger = new Logger(ViewRefreshService.name);

  constructor(private readonly prisma: PrismaService) {}

  formatDateToYMD(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0'); // 0-indexed
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  @Cron('0 0 * * *')
  async refreshView() {
    this.logger.log('View 갱신 시작');

    const date = new Date()
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const before3days = new Date(today);
    before3days.setDate(today.getDate() - 3);
    try {
      await this.prisma.$executeRawUnsafe(`
        SELECT 
          '${this.formatDateToYMD(today)}' AS date,
          RANK() OVER (ORDER BY SUM(total_amount) DESC) AS \`rank\`,
          productId,
          productName,
          SUM(total_amount) AS total_amount,
          SUM(total_sales) AS total_sales
        FROM Product_Sales_Stat
        WHERE salesDate >= '${this.formatDateToYMD(before3days)}' 
          AND salesDate < '${this.formatDateToYMD(today)}'
        GROUP BY productId, productName
        ORDER BY SUM(total_amount) DESC
        LIMIT 5
      `)
    } catch (error) {
      this.logger.error('View 갱신 실패', error)
    } finally {
      this.logger.log('View 갱신 완료');
    }
  }
}