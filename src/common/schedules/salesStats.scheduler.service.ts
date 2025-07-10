import { RedisService } from "@app/redis/redis.service";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class SalesStatScheduler {
  private readonly logger = new Logger(SalesStatScheduler.name);
  private readonly redisKey = 'product:sales:top5';

  constructor(private readonly redisService: RedisService) {}

  @Cron('0 0 * * *')
  async cacheTop5SalesProducts() {
    const client = this.redisService.getClient();

    // D-3 ~ D-1
    const dates = [...Array(3)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i + 1);
      return d.toISOString().split('T')[0];
    });

    const keys = dates.map(date => `product:salesStat:${date}`);
    const tempKey = `temp:product:sales:sum`;

    try {
      await client.zunion(tempKey, keys.length, ...keys);
      const top5 = await client.zrevrange(tempKey, 0, 4, 'WITHSCORES');

      const result = [];
      for (let i=0; i<top5.length; i+=2) {
        result.push({
          productId: top5[i],
          amount: parseInt(top5[i+1], 10),
        });
      }

      await client.set(this.redisKey, JSON.stringify(result), 'EX', 86400); // TTL 1일
      await client.del(tempKey);

      this.logger.log('Top 5 판매 상품 캐시 완료');
    } catch (err) {
      this.logger.error('Top 5 캐시 실패', err);
    }
  }
}