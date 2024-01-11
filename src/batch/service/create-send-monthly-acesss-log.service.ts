import * as path from "path";
import * as moment from "moment-timezone";
import * as fs from "fs";

import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { CronConfig, CronName } from "@src/batch/constant/enum.constant";
import { CoreConfig } from "@src/common/config/configuration";
import { ConfigService } from "@nestjs/config";
import { LoggerService } from "@src/logger/logger.service";
import { convertTxtToPdf } from "@src/util/txt-to-pdf.util";
import { CloudService } from "@src/cloud/service/cloud.service";

@Injectable()
export class CreateSendMonthlyAccessLogService {
  private coreConfig: CoreConfig;
  constructor(private readonly configService: ConfigService, private readonly logger: LoggerService, private readonly cloudService: CloudService) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  /**
   * 매달 1일 시스템 엑세스 로그를 PDF에 모아 관리자에게 이메일 전송
   */
  @Cron(CronConfig.logSchedule, {
    name: CronName.CREATE_AND_SEND_MONTHLY_LOG_JOB,
    timeZone: CronConfig.timezone,
  })
  async makeMonthlyPDFAndSendEmail() {
    this.logger.debug("Starting saving PDF on the 1st day of the month.");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const adminEmail = this.coreConfig.adminEmail;

    if (emailRegex.test(adminEmail)) {
      const currentDate = new Date();
      const newDate = moment(currentDate).tz(CronConfig.timezone).subtract(1, "day");
      const formattedDate = newDate.format("YYYY-MM");

      const dailyLogLocation = path.join(this.coreConfig.logPath, "access", "daily");
      const monthlyLogLocation = path.join(this.coreConfig.logPath, "access", "monthly");
      const pdfFilePath = await convertTxtToPdf(dailyLogLocation, formattedDate, "access", monthlyLogLocation);

      if (fs.existsSync(pdfFilePath)) {
        this.cloudService.postEmailMonthlyLog(pdfFilePath, adminEmail, formattedDate);
        this.logger.debug("Task executed on the 1st day of the month.");
      }
    }
  }
}
