import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditHistoryModule } from "@src/credit-history/credit-history.module";
import { NotificationModule } from "@src/notification/notification.module";
import { Hu3dRepository } from "@src/rus-case/repository/hu3d.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { RusCaseModule } from "@src/rus-case/rus-case.module";
import { StorageService } from "@src/storage/service/storage.service";
import { StorageController } from "@src/storage/storage.controller";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { StudyRepository } from "@src/study/repository/study.repository";
import { StudyModule } from "@src/study/study.module";
import { UserRepository } from "@src/user/repository/user.repository";

@Module({
  imports: [
    HttpModule,
    StudyModule,
    RusCaseModule,
    NotificationModule,
    CreditHistoryModule,
    TypeOrmModule.forFeature([RusCaseRepository, StudyRepository, UserRepository, DicomRepository, Hu3dRepository]),
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
