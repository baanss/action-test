import * as moment from "moment-timezone";
import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { UserRepository } from "@src/user/repository/user.repository";
import { CronConfig, CronName } from "@src/batch/constant/enum.constant";
import { CloudService } from "@src/cloud/service/cloud.service";
import { LoggerService } from "@src/logger/logger.service";

@Injectable()
export class SendEmailInactiveUserService {
  constructor(private readonly userRepository: UserRepository, private cloudService: CloudService, private readonly logger: LoggerService) {}

  /**
   * 최종 접속 시간이 335일 된 일반 사용자에게 메일 발송합니다.
   * - 일 1회 오전 1시
   */
  @Cron(CronConfig.schedule, {
    name: CronName.SEND_EMAIL_INACTIVE_USER_JOB,
    timeZone: CronConfig.timezone,
  })
  async sendEmailInactiveUser() {
    this.logger.debug("Starting SEND_EMAIL_INACTIVE_USER_JOB on every 1:00.");
    // 날짜 범위를 설정합니다.
    const endDate = moment().subtract(335, "days").toDate(); // 335일 전의 날짜를 계산합니다.
    const startDate = moment().subtract(336, "days").toDate(); // 336일 전의 날짜를 계산합니다.

    // 최종 접속 시간이 335일에 해당되는 일반 사용자들을 조회합니다.
    const sleepUsers = await this.userRepository.getManyByLastLoginBetween(startDate, endDate);

    for (const user of sleepUsers) {
      // 예정된 삭제 날짜 계산
      const scheduledDeletionDate = moment().tz(CronConfig.timezone).add(30, "days").format("YYYY-MM-DD").toString();

      // 메일 전송
      this.cloudService.postEmailSleepUser(user.email, scheduledDeletionDate);
    }
    this.logger.debug("Task executed SEND_EMAIL_INACTIVE_USER_JOB on every 1:00.");
  }
}
