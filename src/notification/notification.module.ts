import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NotificationService } from "@src/notification/service/notification.service";
import { NotificationController } from "@src/notification/notification.controller";
import { NotificationRepository } from "@src/notification/repository/notification.repository";

@Module({
  imports: [TypeOrmModule.forFeature([NotificationRepository])],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
