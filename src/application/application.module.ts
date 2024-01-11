import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserModule } from "@src/user/user.module";
import { CloudModule } from "@src/cloud/cloud.module";
import { ApplicationRepository } from "@src/application/repository/application.repository";
import { ApplicationController } from "@src/application/application.controller";
import { ApplicationService } from "@src/application/service/application.service";
import { CheckApplicationService } from "@src/application/service/check-application.service";
import { ApplicationSubscriber } from "@src/application/subscriber/application.subscriber";
import { OtpModule } from "@src/otp/otp.module";

@Module({
  imports: [OtpModule, UserModule, CloudModule, TypeOrmModule.forFeature([ApplicationRepository])],
  controllers: [ApplicationController],
  providers: [ApplicationService, CheckApplicationService, ApplicationSubscriber],
})
export class ApplicationModule {}
