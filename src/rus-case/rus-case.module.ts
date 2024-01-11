import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { UserRepository } from "@src/user/repository/user.repository";
import { CloudModule } from "@src/cloud/cloud.module";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { CreditHistoryModule } from "@src/credit-history/credit-history.module";
import { StudyModule } from "@src/study/study.module";
import { StudyRepository } from "@src/study/repository/study.repository";
import { RecipientRepository } from "@src/recipient/repository/recipient.repository";

import { ClinicalInfoRepository } from "@src/rus-case/repository/clinical-info.repository";
import { Hu3dRepository } from "@src/rus-case/repository/hu3d.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { CreateRusCaseService } from "@src/rus-case/service/create-rus-case.service";
import { RusCaseService } from "@src/rus-case/service/rus-case.service";
import { Hu3dService } from "@src/rus-case/service/hu3d.service";
import { RusCaseController } from "@src/rus-case/rus-case.controller";
import { NotificationModule } from "@src/notification/notification.module";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";

@Module({
  imports: [
    StudyModule,
    HttpModule,
    CreditHistoryModule,
    NotificationModule,
    forwardRef(() => CloudModule),
    TypeOrmModule.forFeature([
      RusCaseRepository,
      ClinicalInfoRepository,
      Hu3dRepository,
      UserRepository,
      CreditHistoryRepository,
      StudyRepository,
      RecipientRepository,
      TotalCreditViewRepository,
    ]),
  ],
  controllers: [RusCaseController],
  providers: [CreateRusCaseService, RusCaseService, Hu3dService],
  exports: [CreateRusCaseService, RusCaseService, Hu3dService],
})
export class RusCaseModule {}
