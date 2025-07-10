import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { DistributedLockService } from './redisDistributedLock.service';
import { CacheService } from './redisCache.service';

@Module({
  providers: [
    RedisService,
    DistributedLockService,
    CacheService,
  ],
  exports: [
    RedisService,
    DistributedLockService,
    CacheService,
  ],
})
export class RedisModule {}
