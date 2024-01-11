import * as fs from "fs";
import * as moment from "moment";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { DicomRepository } from "@src/study/repository/dicom.repository";
import { Dicom } from "@src/common/entity/dicom.entity";
import { CronConfig, CronName } from "@src/batch/constant/enum.constant";
import { LoggerService } from "@src/logger/logger.service";
import { LogType, ServiceType } from "@src/common/constant/enum.constant";

@Injectable()
export class DeleteDicomService {
  private readonly logger = new Logger(DeleteDicomService.name);

  constructor(private readonly dicomRepository: DicomRepository, private readonly loggerService: LoggerService) {}

  private async handleExpiredDicom(dicom: Dicom): Promise<string> {
    const expiredDate = moment(new Date()).subtract(CronConfig.dicomExpiredDays, "days").toDate();
    const filePath = dicom.filePath;
    const fileSize = dicom.fileSize;
    if (dicom.createdAt < expiredDate) {
      try {
        // 다이콤 파일 삭제
        await fs.promises.rm(dicom.filePath);
      } catch (error) {
        // 로그만 남기고 return 하지 않음 -> 파일 정보 갱신 처리
        this.logger.log(
          `E: Remove Failed "${dicom.filePath}"\nPotential reason:\n- DICOM file has been removed from disk. Check this on disk "${dicom.filePath}"`,
        );
      }
      try {
        // 파일 정보 갱신
        await this.dicomRepository.deleteFileById(dicom.id);
      } catch (error) {
        this.logger.log(`E: Fail to update database "${dicom.filePath}"`);
        throw Error(dicom.fileName);
      }
      this.logger.log(
        `Removed "${dicom.fileName}"\n- Previous [fileSize: ${fileSize}, filePath: ${filePath}]\n- Updated [fileSize: ${dicom.fileSize}, filePath: ${dicom.filePath}]`,
      );
      return dicom.fileName;
    } else {
      const remainDays = (dicom.createdAt.getTime() - expiredDate.getTime()) / (1000 * 60 * 60 * 24);
      this.logger.log(`Not Expired ${dicom.fileName}. ${remainDays} days remains`);
      return dicom.fileName;
    }
  }

  /**
   * 유효기간이 지난 다이콤 파일 제거
   * 1. CT 생성 시간과 만료 기간 비교
   * 2. 150일이 자나있으면 파일 삭제
   * 3. 남은 정보 갱신
   */
  @Cron(CronConfig.schedule, {
    name: CronName.DELETE_DICOM_JOB,
    timeZone: CronConfig.timezone,
  })
  async handleDicomCronTask() {
    const [dicoms, dicomsCount] = await this.dicomRepository.getManyWithFilePathAndCount();
    const rmExpiredDicom = dicoms.map(async (dicom) => {
      return this.handleExpiredDicom(dicom);
    });
    return Promise.allSettled(rmExpiredDicom)
      .then((results) => {
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            this.logger.log(`${LogType.DELETE_FILE}, ${index + 1}/${dicomsCount} ${result.value}`);
            this.loggerService.log(ServiceType.SYSTEM, null, LogType.DELETE_FILE, `${index + 1}/${dicomsCount} ${result.value}`);
          } else {
            this.logger.log(`${LogType.DELETE_FILE} ${index + 1}/${dicomsCount} ${result.reason}`);
            this.loggerService.log(ServiceType.SYSTEM, null, LogType.DELETE_FILE, `(fail) ${index + 1}/${dicomsCount} ${result.reason}`);
          }
        });
      })
      .catch((err) => {
        this.logger.error(`${LogType.DELETE_FILE} ${err}`);
      });
  }
}
