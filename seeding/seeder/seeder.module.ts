import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { ProdSeederService } from "@root/seeding/seeder/services/seeder.prod.service";

import { UtilModule } from "@src/util/util.module";

import { StudyRepository } from "@src/study/repository/study.repository";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { Hu3dRepository } from "@src/rus-case/repository/hu3d.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { ClinicalInfoRepository } from "@src/rus-case/repository/clinical-info.repository";
import { FeedbackRepository } from "@src/feedback/repository/feedback.repository";
import { InstallerRepository } from "@src/installer/repository/installer.repository";
import { UpdateLogRepository } from "@src/update-log/repository/update-log.repository";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudyRepository,
      DicomRepository,
      Hu3dRepository,
      RusCaseRepository,
      ClinicalInfoRepository,
      FeedbackRepository,
      InstallerRepository,
      UpdateLogRepository,
      UploadJobRepository,
      CreditHistoryRepository,
    ]),
    UtilModule,
  ],
  providers: [SeederService, ProdSeederService],
  exports: [SeederService],
})
export class SeederModule {}
