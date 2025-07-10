# 주요 기능의 Redis 이관을 위한 디자인 설계 및 개발에 대한 회고

# 1. 개요

본 보고서는 기존 시스템에서 일부 주요 기능을 Redis 기반으로 이관함에 있어 설계 및 개발 과정을 회고하고, 비동기 처리와 랭킹 통계를 포함한 Redis의 활용 방식을 기술한다. 이를 통해 시스템의 성능 향상과 확장성 확보를 도모하였다.

# 2. 문제 배경

기존 시스템은 모든 처리를 RDBMS에 의존하고 있었으며, 다음과 같은 문제점이 존재하였다. 인기 상품 통계 조회 시 높은 부하- 쿠폰 발급 요청의 병목 현상- 실시간성 부족 및 확장성 한계에 따라 Redis를 활용한 캐싱 및 비동기 처리를 통해 성능 개선 및 구조 리팩토링을 추진하였다.

# 3. Redis 기반 인터페이스 설계

ioredis 추상화를 통해 비즈니스 로직과의 결합도 최소화, RedisService / RedisRepository 패턴 도입으로 DIP(의존성 역전 원칙) 적용기존 시스템의 인터페이스 구조와 일관되도록 설계하여 도입 비용 최소화

# 4. 시스템 리팩토링 설계

기존 인기 상품 집계 기능을 ZINCRBY / ZREVRANGE / ZUNIONSTORE 등으로 리팩토링쿠폰 발급 요청을 ZSET 큐로 관리하여 비동기 발급 처리TTL 기반의 유효기간 설정으로 불필요한 데이터 자동 정리트랜잭션이 필요한 경우 Lua 스크립트 또는 Redis Transaction을 활용

# 5. 트랜잭션 설계 및 부가 기능

Redis에서는 랭킹, TTL, 정렬이 필요한 기능에 최적화된 자료구조 활용쿠폰 발급 시 Redis 상태를 반영하고, 최종 결과는 MySQL에 저장하여 일관성 확보 및 트랜잭션 보장이 필요한 부분은 RDBMS가 담당하고, Redis는 속도와 캐시 중심으로 분리

# 6. 기능 안정성 및 테스트

Redis TTL 및 키 삭제 이벤트 시나리오 검토통합 테스트를 통해 Redis-MySQL간 일관성 확인ZSET 발급 큐의 공정성, TTL 만료 시 처리 흐름 등을 테스트

# 7. 한계점 및 고려사항

Redis는 데이터 영속성을 보장하지 않으므로 핵심 데이터는 RDBMS 병행 유지클러스터 구성 시 복잡도 증가 및 모니터링 이슈 발생 가능성 존재, TTL 기반 삭제는 예측 불가능한 시점에 발생하므로 주기적 보정 필요

# 8. 결론

Redis 이관을 통해 주요 기능의 성능 향상 및 구조 분리가 가능했으며, 인터페이스 추상화와 트랜잭션 분리를 통해 기능 안정성을 확보하였다. 앞으로도 비정형 데이터, 실시간 통계 등 Redis의 장점을 극대화하는 방향으로 확장해 나갈 수 있다.

예시 코드:

```tsx
constructor(private readonly redisService: RedisService) {}

const client = this.redisService.getClient();
await client.zincrby(`product:salesStat:${today}`, salesCount, productId);
```

위 코드는 RedisService를 활용하여 내부적으로 ioredis에 의존하지 않고, 추상화 계층을 통해 Redis 명령어를 실행하는 예시이다.

```tsx
tsawait client.zunion(tempKey, keys.length, ...keys);
const top5 = await client.zrevrange(tempKey, 0, 4, 'WITHSCORES');
```

기존 RDBMS에서 집계 쿼리를 사용하던 방식에서, Redis Sorted Set을 활용하여 인기 상품 Top5를 집계하고 랭킹을 계산하는 구조로 개선하였다.

```tsx
await this.memberCouponRepository.issueCoupon(memberId, couponId, tx);
await this.redisService.getClient().zadd(queueKey, score, JSON.stringify({ memberId, couponId }));
```

쿠폰 발급과 Redis ZSET 큐 추가는 트랜잭션 흐름에 따라 순차적으로 이루어지며, MySQL과 Redis 간의 일관성 확보를 위해 구조를 분리하여 처리하였다.