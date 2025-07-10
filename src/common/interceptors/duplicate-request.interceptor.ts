// duplicate-request.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ConflictException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class DuplicateRequestInterceptor implements NestInterceptor {
  private readonly requestLocks = new Map<string, NodeJS.Timeout>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip; // 로그인 안 했을 경우 IP 기반
    const path = request.method + ':' + request.url;

    const key = `${userId}:${path}`;

    if (this.requestLocks.has(key)) {
      throw new ConflictException('중복 요청입니다. 잠시 후 다시 시도해주세요.');
    }

    // 잠금 설정 (예: 5s)
    this.requestLocks.set(
      key,
      setTimeout(() => {
        this.requestLocks.delete(key);
      }, 5000),
    );

    return next.handle().pipe(
      catchError((err) => {
        // 에러 나도 락 제거
        this.clearLock(key);
        throw err;
      }),
      tap(() => {
        // 정상적으로 처리됐으면 락 제거
        this.clearLock(key);
      }),
    );
  }

  private clearLock(key: string) {
    const timeout = this.requestLocks.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.requestLocks.delete(key);
    }
  }
}
