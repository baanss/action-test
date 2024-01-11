import * as path from "path";
import { diskStorage } from "multer";

import { BadRequestException, Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";

import { CoreConfig } from "@src/common/config/configuration";

import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { UserRepository } from "@src/user/repository/user.repository";
import { SessionRepository } from "@src/auth/repository/session.repository";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";

import { UserController } from "@src/user/user.controller";
import { CheckUserService } from "@src/user/service/check-user.service";
import { UserService } from "@src/user/service/user.service";

import { OtpRepository } from "@src/otp/repository/otp.repository";
import { CloudModule } from "@src/cloud/cloud.module";
import { AuthModule } from "@src/auth/auth.module";
import { OtpModule } from "@src/otp/otp.module";

@Module({
  imports: [
    HttpModule,
    CloudModule,
    OtpModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([UserRepository, SessionRepository, RusCaseRepository, OtpRepository, TotalCreditViewRepository]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        fileFilter(req, file, cb) {
          // .png, .jpg, .jpeg만 허용
          const isValidMimeType = ["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype);
          if (!isValidMimeType) {
            const errorMsg = "File mult be one of the following mime types: image/png, image/jpg, image/jpeg";
            return cb(new BadRequestException(errorMsg), false);
          }
          return cb(null, true);
        },
        storage: diskStorage({
          destination: path.join(configService.get<CoreConfig>("core").etcPath, "profile"),
          filename: (req, file, cb) => {
            // 랜덤한 파일명 + 원래 파일 확장자
            const ext = file.mimetype.split("/")[1];
            const name = new Date().getTime().toString(36);
            return cb(null, name + "." + ext);
          },
        }),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [CheckUserService, UserService],
  exports: [UserService, CheckUserService],
})
export class UserModule {}
