import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { StudyRepository } from "@src/study/repository/study.repository";
import { StudyService } from "@src/study/service/study.service";
import { StudyController } from "@src/study/study.controller";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { DicomService } from "./service/dicom.service";
import { NotificationModule } from "@src/notification/notification.module";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { UploadJobModule } from "@src/upload-job/upload-job.module";

@Module({
  imports: [NotificationModule, UploadJobModule, TypeOrmModule.forFeature([StudyRepository, DicomRepository, UploadJobRepository, NotificationRepository])],
  controllers: [StudyController],
  providers: [StudyService, DicomService],
  exports: [StudyService, DicomService],
})
export class StudyModule {}
