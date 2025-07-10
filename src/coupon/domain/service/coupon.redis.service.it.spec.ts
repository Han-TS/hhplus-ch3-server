import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CouponRedisService } from './coupon.redis.service';
import { PrismaService } from '@app/database/prisma/prisma.service';
import { RedisService } from '@app/redis/redis.service';
import { CouponRepository } from '@app/coupon/infrastructure/coupon.repository';
import { MemberCouponRepository } from '@app/coupon/infrastructure/member_coupon.repository';
import { CouponRedisRepository } from '@app/coupon/infrastructure/coupon.redis.repository';
import { TransactionService } from '@app/database/prisma/transaction.service';
import { UseCouponCommand } from '../dto/use-coupon.command.dto';
import { IssueCouponCommand } from '../dto/issue-coupon.command.dto';
import { ICOUPON_REPOSITORY } from '../repository/coupon.repository.interface';
import { IMEMBER_COUPON_REPOSITORY } from '../repository/member_coupon.repository.interface';
import { ICOUPON_REDIS_REPOSITORY } from '../repository/coupon.redis.repository.interface';
import { RedisModule } from '@app/redis/redis.module';
import { KafkaModule } from '@app/kafka/kafka.module';
import { Kafka } from 'kafkajs';

describe('CouponRedisService 통합 테스트', () => {
  let app: INestApplication;
  let service: CouponRedisService;
  let prisma: PrismaService;
  let redis: RedisService;

  const TEST_OUTBOX_ID = 1;
  const TEST_COUPON_ID = 100;
  const TEST_MEMBER_ID = 1;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RedisModule, KafkaModule],
      providers: [
        CouponRedisService,
        { provide: ICOUPON_REPOSITORY, useClass: CouponRepository },
        { provide: IMEMBER_COUPON_REPOSITORY, useClass: MemberCouponRepository },
        { provide: ICOUPON_REDIS_REPOSITORY, useClass: CouponRedisRepository },
        PrismaService,
        TransactionService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    service = module.get(CouponRedisService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);

    // 초기 데이터 설정
    await prisma.member.create({
      data: {
        id: TEST_MEMBER_ID,
        name: '테스트 유저',
        balance: 100000,
      },
    });
    await prisma.coupon.create({
      data: {
        id: TEST_COUPON_ID,
        name: '테스트 쿠폰',
        type: 'FLAT',
        offFigure: 300,
        stock: 10,
      },
    });

    // topic 생성
    const kafka = new Kafka({
      clientId: 'test-admin',
      brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`]
    });

    const admin = kafka.admin();
    await admin.connect();

    await admin.createTopics({
      topics: [
        {
          topic: 'issue.coupon.requested',
          numPartitions: 1,
          replicationFactor: 1,
        }
      ]
    });

    await admin.disconnect();
  });

  afterAll(async () => {
    await prisma.member_Coupon.deleteMany();
    await prisma.coupon.deleteMany();
    const client = redis.getClient();
    await client.flushall();
    await app.close();
  });

  it('쿠폰 발급부터 사용까지 전체 흐름이 성공적으로 수행된다', async () => {
    // 1. Redis에 재고 등록
    await service.enrollCouponStock(TEST_COUPON_ID, 10);

    // 2. 발급 요청 등록
    const issueCouponCommand: IssueCouponCommand = { memberId: TEST_MEMBER_ID, couponId: TEST_COUPON_ID };
    await service.requestIssueCoupon(issueCouponCommand);

    // 3. 발급 처리
    await service.processIssueCoupon(TEST_OUTBOX_ID, TEST_COUPON_ID, TEST_MEMBER_ID);

    // 4. 쿠폰 사용 처리
    const useCouponCommand: UseCouponCommand = { memberId: TEST_MEMBER_ID, couponId: TEST_COUPON_ID, amount: 1000 };
    const result = await service.useCoupon(useCouponCommand);

    expect(result.discountedAmount).toBe(700);
    expect(result.coupon.type).toBe('FLAT');

    // 5. Redis에서 사용 여부가 1로 변경되었는지 확인
    const redisClient = redis.getClient();
    const status = await redisClient.hget(
      `member:${TEST_MEMBER_ID}:coupons`,
      TEST_COUPON_ID.toString()
    );
    expect(status).toBe('1');

    // 6. DB에도 사용 처리 내역이 기록되었는지 확인
    const memberCoupon = await prisma.member_Coupon.findUnique({
      where: {
        memberId_couponId: {
          memberId: TEST_MEMBER_ID,
          couponId: TEST_COUPON_ID,
        },
      },
    });
    
    expect(memberCoupon?.isUsed).toBe(true);
  });
});
