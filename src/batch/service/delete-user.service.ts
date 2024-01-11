import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { CronConfig, CronName } from "@src/batch/constant/enum.constant";
import { LoggerService } from "@src/logger/logger.service";
import { UserService } from "@src/user/service/user.service";

@Injectable()
export class DeleteUserService {
  constructor(private readonly logger: LoggerService, private readonly userService: UserService) {}

  /**
   * 최종 접속 시간이 365일 지난 일부 유저 삭제
   * - 일 1회 오전 1시
   */
  @Cron(CronConfig.schedule, {
    name: CronName.DELETE_SLEEP_USER_JOB,
    timeZone: CronConfig.timezone,
  })
  async deleteSleepUser(): Promise<void> {
    this.logger.debug("Starting DELETE_SLEEP_USER_JOB on every 1:00.");
    await this.userService.deleteManyInSleepOneYear();
    this.logger.debug("Task executed DELETE_SLEEP_USER_JOB on every 1:00.");
  }
}
