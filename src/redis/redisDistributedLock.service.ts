import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DistributedLockService {
  private readonly lockPrefix = 'lock:';
  private readonly channelPrefix = 'lock:channel:';
  private readonly lockTimeout = 10000; // 10초
  private readonly waitTimeout = 5000; // 최대 10초 기다림

  constructor(
    private readonly redisService: RedisService,
  ) {}

  private buildKey(resource: string) {
    return `${this.lockPrefix}${resource}`;
  }

  private buildChannel(resource: string) {
    return `${this.channelPrefix}${resource}`;
  }

  async acquireLock(resource: string): Promise<string | null> {
    const client = this.redisService.getClient();
    const key = this.buildKey(resource);
    const lockId = uuidv4();

    const result = await client.set(key, lockId, 'PX', this.lockTimeout, 'NX');
    if (result === 'OK') {
      return lockId;
    }
    return null;
  }

  async waitForUnlock(resource: string): Promise<void> {
    const subscriber = this.redisService.getSubscriber();
    const channel = this.buildChannel(resource);

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        subscriber.unsubscribe(channel);
        reject(new Error(`waitForUnlock timeout: ${resource}`));
      }, this.waitTimeout);

      const handler = (messageChannel: string, message: string) => {
        if (messageChannel === channel && message === 'released') {
          clearTimeout(timeout);
          subscriber.unsubscribe(channel);
          resolve();
        }
      };

      subscriber.subscribe(channel);
      subscriber.on('message', handler);
    });
  }

  async releaseLock(resource: string, lockId: string): Promise<void> {
    const client = this.redisService.getClient();
    const publisher = this.redisService.getPublisher();
    const key = this.buildKey(resource);
    const channel = this.buildChannel(resource);

    const currentLockId = await client.get(key);
    if (currentLockId === lockId) {
      await client.del(key);
      await publisher.publish(channel, 'released'); // 🔥 락 해제 신호 보내기
      return;
    }
    else {
      throw Error(`NOT_MY_LOCK:${key}:${lockId}`);
    }
  }

  async acquireLockWithWait(resource: string): Promise<string> {
    while (true) {
      const lockId = await this.acquireLock(resource);
      if (lockId) {
        return lockId;
      }
      await this.waitForUnlock(resource); // 락 해제될 때까지 기다림
    }
  }

  async acquireMultiLockWithWait(resources: string[]): Promise<Map<string, string>> {
    const sortedResources = resources.sort(); // 항상 정렬
    const locks = new Map<string, string>();
  
    while (true) {
      let failedResource: string | null = null;
  
      for (const resource of sortedResources) {
        const lockId = await this.acquireLock(resource);
        if (lockId) {
          locks.set(resource, lockId);
        } else {
          failedResource = resource;
          break;
        }
      }
  
      if (!failedResource) {
        // 모든 락 성공
        return locks;
      }
  
      // 실패한 경우 지금까지 잡은 락 해제
      await this.releaseMultiLock(locks);
      locks.clear();
  
      // 실패한 리소스 pub/sub 대기
      await this.waitForUnlock(failedResource);
    }
  }

  async releaseMultiLock(locks: Map<string, string>): Promise<void> {
    for (const [resource, lockId] of locks.entries()) {
      await this.releaseLock(resource, lockId);
    }
  }
}
