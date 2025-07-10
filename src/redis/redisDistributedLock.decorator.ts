import { DistributedLockService } from './redisDistributedLock.service';
import { InternalServerErrorException } from '@nestjs/common';

export function DistributedLock(lockKeyGenerator: (...args: any[]) => string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lockService: DistributedLockService = this.lockService;
      if (!lockService) {
        throw new InternalServerErrorException('LockService가 주입되지 않았습니다.');
      }

      const lockKey = lockKeyGenerator(...args);

      const lockId = await lockService.acquireLockWithWait(lockKey);
      try {
        return await originalMethod.apply(this, args);
      } finally {
        if (lockId) {
          await lockService.releaseLock(lockKey, lockId);
        }
      }
    };

    return descriptor;
  };
}


export function DistributedMultiLock(lockKeyGenerators: ((...args: any[]) => string)[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lockService: DistributedLockService = this.lockService;
      if (!lockService) {
        throw new InternalServerErrorException('LockService가 주입되지 않았습니다.');
      }

      const lockKeys = lockKeyGenerators.map(fn => fn(...args)).sort();
      let locks: Map<string, string> | null = null;

      try {
        locks = await lockService.acquireMultiLockWithWait(lockKeys); // 🔥 wait 지원하는 멀티 락
        return await originalMethod.apply(this, args);
      } finally {
        if (locks) {
          await lockService.releaseMultiLock(locks);
        }
      }
    };

    return descriptor;
  };
}

export function DistributedMultiLockWithArray(lockKeyGenerators: (...args: any[]) => string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const lockService: DistributedLockService = this.lockService;
      if (!lockService) {
        throw new InternalServerErrorException('LockService가 주입되지 않았습니다.');
      }

      const lockKeys = lockKeyGenerators(...args).sort();
      let locks: Map<string, string> | null = null;

      try {
        locks = await lockService.acquireMultiLockWithWait(lockKeys); // 🔥 wait 지원하는 멀티 락
        return await originalMethod.apply(this, args);
      } finally {
        if (locks) {
          await lockService.releaseMultiLock(locks);
        }
      }
    };

    return descriptor;
  };
}