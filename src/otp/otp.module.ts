import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CloudModule } from "@src/cloud/cloud.module";
import { OtpRepository } from "@src/otp/repository/otp.repository";
import { OtpService } from "@src/otp/service/otp.service";
import { UserRepository } from "@src/user/repository/user.repository";
import { OtpController } from "@src/otp/otp.controller";

@Module({
  imports: [CloudModule, TypeOrmModule.forFeature([OtpRepository, UserRepository])],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
