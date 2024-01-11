import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserRepository } from "@src/user/repository/user.repository";
import { SessionRepository } from "@src/auth/repository/session.repository";

import { AuthService } from "@src/auth/service/auth.service";
import { SessionService } from "@src/auth/service/session.service";

import { AuthController } from "@src/auth/auth.controller";
import { AuthConfig } from "@src/common/config/configuration";
import { HttpModule } from "@nestjs/axios";
import { OtpRepository } from "@src/otp/repository/otp.repository";
import { UserModule } from "@src/user/user.module";

@Module({
  imports: [
    HttpModule,
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([UserRepository, SessionRepository, OtpRepository]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.get<AuthConfig>("auth");
        return {
          secret: authConfig.jwtSecret,
          signOptions: { expiresIn: authConfig.jwtExpiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
