import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";

import { DicomRepository } from "@src/study/repository/dicom.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";
import { DeleteDicomService } from "@src/batch/service/delete-dicom.service";
import { DeleteNotificationService } from "@src/batch/service/delete-notication.service";
import { DeleteUserService } from "@src/batch/service/delete-user.service";
import { CreateNotificationService } from "@src/batch/service/create-notification.service";
import { TaskService } from "@src/batch/service/task.service";
import { CreateSendMonthlyAccessLogService } from "@src/batch/service/create-send-monthly-acesss-log.service";
import { StudyModule } from "@src/study/study.module";
import { SendEmailInactiveUserService } from "@src/batch/service/send-email-inactive-user.service";
import { CreditHistoryModule } from "@src/credit-history/credit-history.module";
import { CloudModule } from "@src/cloud/cloud.module";
import { RedisModule } from "@src/cache/redis.module";
import { UserModule } from "@src/user/user.module";
import { UserRepository } from "@src/user/repository/user.repository";
import { UploadJobModule } from "@src/upload-job/upload-job.module";

@Module({
  imports: [
    RedisModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([DicomRepository, NotificationRepository, RusCaseRepository, UserRepository, TotalCreditViewRepository]),
    StudyModule,
    HttpModule,
    CreditHistoryModule,
    CloudModule,
    UserModule,
    UploadJobModule,
  ],
  providers: [
    TaskService,
    CreateNotificationService,
    DeleteDicomService,
    DeleteNotificationService,
    DeleteUserService,
    CreateSendMonthlyAccessLogService,
    SendEmailInactiveUserService,
  ],
})
export class BatchModule {}
