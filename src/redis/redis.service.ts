import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private cluster: Redis.Cluster | Redis.Redis;
  private subscriberCluster: Redis.Cluster | Redis.Redis;
  private subscriptions = new Map<string, (channel: string, message: string) => void>();
  private isClusterMode: boolean;

  constructor() {
    this.isClusterMode = process.env.REDIS_CLUSTER_MODE === 'true';
  }

  onModuleInit() {
    if(this.isClusterMode) {
      const clusterNodes = [
        { host: '127.0.0.1', port: 7001 },
        { host: '127.0.0.1', port: 7002 },
        { host: '127.0.0.1', port: 7003 },
        { host: '127.0.0.1', port: 7004 },
        { host: '127.0.0.1', port: 7005 },
        { host: '127.0.0.1', port: 7006 },
      ];

      const clusterOptions: Redis.ClusterOptions = {
        redisOptions: {
          password: '', // TODO: 환경변수 분리 추천
        },
      };

      this.cluster = new Redis.Cluster(clusterNodes, clusterOptions);
      this.subscriberCluster = new Redis.Cluster(clusterNodes, clusterOptions);
    } else {
      const redisOptions: Redis.RedisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: '',
      };

      this.cluster = new Redis.Redis(redisOptions);
      this.subscriberCluster = new Redis.Redis(redisOptions);
    }

    this.cluster.on('connect', () => this.logger.log('Redis Cluster connected'));
    this.cluster.on('error', (err) => this.logger.error('Redis Cluster error', err));
    this.subscriberCluster.on('connect', () => this.logger.log('Redis Subscriber Cluster connected'));
    this.subscriberCluster.on('error', (err) => this.logger.error('Redis Subscriber Cluster error', err));
  }

  getClient(): Redis.Cluster | Redis.Redis {
    return this.cluster;
  }

  getSubscriber(): Redis.Cluster | Redis.Redis {
    return this.subscriberCluster;
  }

  getPublisher(): Redis.Cluster | Redis.Redis {
    return this.cluster;
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.getPublisher().publish(channel, message);
  }

  async subscribe(channel: string, callback: (channel: string, message: string) => void): Promise<void> {
    if (this.subscriptions.has(channel)) {
      this.logger.warn(`Already subscribed to channel: ${channel}`);
      return;
    }

    await this.subscriberCluster.subscribe(channel);
    const handler = (receivedChannel: string, message: string) => {
      if (receivedChannel === channel) {
        callback(receivedChannel, message);
      }
    };

    this.subscriberCluster.on('message', handler);
    this.subscriptions.set(channel, handler);
  }

  async unsubscribe(channel: string): Promise<void> {
    const handler = this.subscriptions.get(channel);
    if (handler) {
      this.subscriberCluster.off('message', handler);
      this.subscriptions.delete(channel);
      await this.subscriberCluster.unsubscribe(channel);
    }
  }

  async onModuleDestroy() {
    try {
      await this.cluster.quit();
      this.logger.log('Redis Cluster disconnected');
    } catch (err) {
      this.logger.error('Error disconnecting Redis Cluster', err);
    }

    try {
      await this.subscriberCluster.quit();
      this.logger.log('Redis Subscriber Cluster disconnected');
    } catch (err) {
      this.logger.error('Error disconnecting Redis Subscriber Cluster', err);
    }
  }
}
