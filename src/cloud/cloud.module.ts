import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RusCaseModule } from "@src/rus-case/rus-case.module";
import { CloudController } from "@src/cloud/cloud.controller";
import { CloudService } from "@src/cloud/service/cloud.service";
import { CreditHistoryModule } from "@src/credit-history/credit-history.module";
import { RecipientRepository } from "@src/recipient/repository/recipient.repository";
import { BalanceViewRepository } from "@src/credit-history/repository/balance-view.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";

@Module({
  imports: [
    forwardRef(() => RusCaseModule),
    CreditHistoryModule,
    HttpModule,
    TypeOrmModule.forFeature([RecipientRepository, BalanceViewRepository, RusCaseRepository]),
  ],
  controllers: [CloudController],
  providers: [CloudService],
  exports: [CloudService],
})
export class CloudModule {}
