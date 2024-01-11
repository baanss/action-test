import * as moment from "moment";
import { LessThan } from "typeorm";

import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { CronConfig, CronName } from "@src/batch/constant/enum.constant";
import { LoggerService } from "@src/logger/logger.service";

@Injectable()
export class DeleteNotificationService {
  constructor(private readonly logger: LoggerService, private readonly notificationRepository: NotificationRepository) {}

  /**
   * 생성된지 30일이 지난 알림 삭제
   * - 일 1회 오전 1시
   */
  @Cron(CronConfig.schedule, {
    name: CronName.DELETE_NOTIFICATION_JOB,
    timeZone: CronConfig.timezone,
  })
  async deleteNotification() {
    this.logger.debug("Starting DELETE_NOTIFICATION_JOB on every 1:00.");
    const aMonthAgo = moment(new Date()).subtract(CronConfig.notificationExpiredDays, "days").toISOString();
    await this.notificationRepository.delete({ createdAt: LessThan(aMonthAgo) }); // 오늘로부터 30일 전 날짜보다 작으면 삭제
    this.logger.debug("Task executed DELETE_NOTIFICATION_JOB on every 1:00.");
  }
}
