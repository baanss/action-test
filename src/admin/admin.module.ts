import { Module } from "@nestjs/common";

import { UserModule } from "@src/user/user.module";
import { OtpModule } from "@src/otp/otp.module";
import { AdminController } from "@src/admin/admin.controller";

@Module({
  imports: [UserModule, OtpModule],
  controllers: [AdminController],
})
export class AdminModule {}
