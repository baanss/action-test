import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { HttpException, MiddlewareConsumer, Module, NestModule, RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import configuration from "@src/common/config/configuration";
import { RolesGuard } from "@src/common/guard/role.guard";
import { LoggingInterceptor } from "@src/common/interceptor/logging.interceptor";
import { HttpExceptionFilter } from "@src/common/filter/http-exception.filter";
import { HCloudServerAuthMiddleware, RusServiceAuthMiddleware, ServerAuthMiddleware } from "@src/common/middleware/server-auth.middleware";
import { UserAuthMiddleware } from "@src/common/middleware/user-auth.middleware";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { AdminModule } from "@src/admin/admin.module";
import { ApplicationModule } from "@src/application/application.module";
import { AuthModule } from "@src/auth/auth.module";
import { BatchModule } from "@src/batch/batch.module";
import { CloudModule } from "@src/cloud/cloud.module";
import { CreditModule } from "@src/credit/credit.module";
import { CreditHistoryModule } from "@src/credit-history/credit-history.module";
import { DatabaseModule } from "@src/database/database.module";
import { FeedbackModule } from "@src/feedback/feedback.module";
import { InstallerModule } from "@src/installer/installer.module";
import { LoggerModule } from "@src/logger/logger.module";
import { NotificationModule } from "@src/notification/notification.module";
import { OtpModule } from "@src/otp/otp.module";
import { QrModule } from "@src/qr/qr.module";
import { RecipientModule } from "@src/recipient/recipient.module";
import { RedisModule } from "@src/cache/redis.module";
import { RusAppModule } from "@src/rus-app/rus-app.module";
import { RusCaseModule } from "@src/rus-case/rus-case.module";
import { ServerLogModule } from "@src/server-log/server-log.module";
import { SurgeonModule } from "@src/surgeon/surgeon.module";
import { StorageModule } from "@src/storage/storage.module";
import { StudyModule } from "@src/study/study.module";
import { UpdateLogModule } from "@src/update-log/update-log.module";
import { UploadJobModule } from "@src/upload-job/upload-job.module";
import { UserModule } from "@src/user/user.module";
import { UtilModule } from "@src/util/util.module";

import { AppController } from "@src/app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    // system
    LoggerModule,
    DatabaseModule,
    BatchModule,
    RedisModule,
    // domain
    AdminModule,
    AuthModule,
    CloudModule,
    CreditHistoryModule,
    FeedbackModule,
    InstallerModule,
    NotificationModule,
    RusAppModule,
    RusCaseModule,
    StorageModule,
    StudyModule,
    UpdateLogModule,
    UserModule,
    UtilModule,
    QrModule,
    UploadJobModule,
    OtpModule,
    RecipientModule,
    SurgeonModule,
    ApplicationModule,
    CreditModule,
    ServerLogModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true, // 엔티티에 없는 값 거름
          forbidNonWhitelisted: true, // 엔티티에 없는 값에 대한 에러 메세지 추가
          transform: true, // 컨트롤러에 정의한 타입으로 형변환
          exceptionFactory: (errors) => {
            const message = [];
            errors.forEach((error) => {
              message.push(...Object.values(error.constraints));
            });
            return new HttpException({ ...HutomHttpException.BAD_REQUEST, message }, HutomHttpException.BAD_REQUEST.statusCode);
          },
        }),
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAuthMiddleware)
      .exclude(
        // root
        { path: "/", method: RequestMethod.GET },
        { path: "cache", method: RequestMethod.GET },
        { path: "server-status", method: RequestMethod.GET },
        // auth
        { path: "auth/user/login", method: RequestMethod.POST },
        { path: "auth/admin/login", method: RequestMethod.POST },
        { path: "auth/rus-client/login", method: RequestMethod.POST },
        // cloud
        { path: "cloud/echo", method: RequestMethod.GET },
        // rus-case
        { path: "rus-cases", method: RequestMethod.PATCH },
        { path: "rus-cases/hu3d", method: RequestMethod.POST },
        // feedbacks
        { path: "feedbacks", method: RequestMethod.POST },
        // studies
        { path: "studies", method: RequestMethod.POST },
        // applications
        { path: "applications", method: RequestMethod.POST },
        // upload-jobs
        { path: "upload-jobs/hu-id", method: RequestMethod.GET },
        // qr
        { path: "qr/echo", method: RequestMethod.GET },
        // user
        { path: "users/:id(\\d+)/password", method: RequestMethod.PATCH },
        // otp
        { path: "otps", method: RequestMethod.POST },
        { path: "otps", method: RequestMethod.GET },
        // installer
        { path: "installers", method: RequestMethod.POST },
        // update-log
        { path: "update-logs", method: RequestMethod.POST },
        // credit
        { path: "credits", method: RequestMethod.GET },
        { path: "credits/allocate", method: RequestMethod.POST },
        { path: "credits/revoke", method: RequestMethod.POST },
        // admin
        { path: "admins", method: RequestMethod.POST },
        { path: "admins/delete", method: RequestMethod.POST },
        // server-log
        { path: "server-logs/download", method: RequestMethod.GET },
      )
      .forRoutes("*");

    consumer.apply(HCloudServerAuthMiddleware).forRoutes(
      // h-cloud
      { path: "rus-cases", method: RequestMethod.PATCH },
      { path: "rus-cases/hu3d", method: RequestMethod.POST },
      { path: "feedbacks", method: RequestMethod.POST },
      // installer
      { path: "installers", method: RequestMethod.POST },
      // update-log
      { path: "update-logs", method: RequestMethod.POST },
      // credit
      { path: "credits", method: RequestMethod.GET },
      { path: "credits/allocate", method: RequestMethod.POST },
      { path: "credits/revoke", method: RequestMethod.POST },
      // admin
      { path: "admins", method: RequestMethod.POST },
      { path: "admins/delete", method: RequestMethod.POST },
      // server-log
      { path: "server-logs/download", method: RequestMethod.GET },
    );

    consumer.apply(ServerAuthMiddleware).forRoutes(
      // dicom-server
      { path: "studies", method: RequestMethod.POST },
      { path: "upload-jobs/hu-id", method: RequestMethod.GET },
    );

    consumer.apply(RusServiceAuthMiddleware).forRoutes(
      // rus-client
      { path: "auth/rus-client/login", method: RequestMethod.POST },
    );
  }
}
