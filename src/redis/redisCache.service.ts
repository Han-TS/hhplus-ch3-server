import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { plainToInstance, instanceToPlain } from 'class-transformer';

@Injectable()
export class CacheService {
  constructor(private readonly redisService: RedisService) {}

  async set<T>(key: string, value: T, ttlInSeconds?: number): Promise<void> {
    const client = this.redisService.getClient();

    // 클래스 인스턴스를 plain 객체로 변환
    const plainObject = instanceToPlain(value);
    const jsonValue = JSON.stringify(plainObject);

    if (ttlInSeconds) {
      await client.set(key, jsonValue, 'EX', ttlInSeconds);
    } else {
      await client.set(key, jsonValue);
    }
  }

  async get<T>(key: string, dtoClass: new () => T): Promise<T | null> {
    const client = this.redisService.getClient();
    const value = await client.get(key);
    if (!value) return null;

    try {
      const parsed = JSON.parse(value);
      return plainToInstance(dtoClass, parsed); // plain → DTO
    } catch (err) {
      return null;
    }
  }

  async getOrSet<T>(
    key: string,
    dtoClass: new () => T,
    ttlInSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key, dtoClass);
    if (cached !== null) return cached;

    const freshData = await fetcher();
    await this.set<T>(key, freshData, ttlInSeconds);
    return freshData;
  }

  async delete(key: string): Promise<void> {
    const client = this.redisService.getClient();
    await client.del(key);
  }

  async refresh<T>(key: string, dtoClass: new () => T, value: T, ttlInSeconds?: number): Promise<void> {
    await this.delete(key);
    await this.set<T>(key, value, ttlInSeconds);
  }  

  async flushAll(): Promise<void> {
    const client = this.redisService.getClient();
  
    if ('nodes' in client) {
      // 클러스터 모드
      const nodes = client.nodes('master');
      for (const node of nodes) {
        await node.flushdb();
      }
    } else {
      // 단일 노드
      await client.flushdb();
    }
  }

  // ---------- 배열 전용 ----------
  async setArray<T>(key: string, value: T[], ttlInSeconds?: number): Promise<void> {
    if (!value || value.length === 0) return;

    const client = this.redisService.getClient();
    const plain = instanceToPlain(value);
    const json = JSON.stringify(plain);

    ttlInSeconds
      ? await client.set(key, json, 'EX', ttlInSeconds)
      : await client.set(key, json);
  }

  async getArray<T>(key: string, dtoClass: new () => T): Promise<T[] | null> {
    const client = this.redisService.getClient();
    const value = await client.get(key);
    if (!value) return null;

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? plainToInstance(dtoClass, parsed) : null;
    } catch (err) {
      console.error(`Redis getArray() 역직렬화 실패 [key=${key}]`, err);
      return null;
    }
  }

  async getOrSetArray<T>(
    key: string,
    dtoClass: new () => T,
    ttlInSeconds: number,
    fetcher: () => Promise<T[]>,
  ): Promise<T[]> {
    const cached = await this.getArray<T>(key, dtoClass);
    if (cached !== null) return cached;

    const freshData = await fetcher();
    if (freshData && freshData.length > 0) {
      await this.setArray<T>(key, freshData, ttlInSeconds);
    }
    return freshData;
  }

  async refreshArray<T>(key: string, value: T[], ttlInSeconds?: number): Promise<void> {
    await this.delete(key);
    await this.setArray<T>(key, value, ttlInSeconds);
  }
}
