import { Module } from "@nestjs/common";
import { MemberService } from "./domain/service/member.service";
import { MemberController } from "./presentation/member.controller";
import { MemberRepository } from "./infrastructure/member.repository";
import { PrismaModule } from "@app/database/prisma/prisma.module";
import { BalanceHisotryRepository } from "./infrastructure/balanceHistory.repository";
import { IMEMBER_REPOSITORY } from "./domain/repository/member.repository.interface";
import { IBALANCE_HISTORY_REPOSITORY } from "./domain/repository/balanceHistory.repository.interface";
import { RedisModule } from "@app/redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MemberController],
  providers: [
    MemberService,
    {
      provide: IMEMBER_REPOSITORY,
      useClass: MemberRepository,
    },
    {
      provide: IBALANCE_HISTORY_REPOSITORY,
      useClass: BalanceHisotryRepository,
    },
  ],
  exports: [MemberService],
})
export class MemberModule {}
