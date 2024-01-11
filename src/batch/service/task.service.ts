import { Connection } from "typeorm";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry, Timeout } from "@nestjs/schedule";
import { CronConfig, EncryptionStatus, CronStatus } from "@src/batch/constant/enum.constant";
import { StudyRepository } from "@src/study/repository/study.repository";
import { StudyService } from "@src/study/service/study.service";
import { CronCryptoTaskDto } from "@src/batch/dto/task.dto";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ServerConfig } from "@src/common/config/configuration";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { UploadJobService } from "@src/upload-job/service/upload-job.service";

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private serverConfig: ServerConfig;

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private readonly connection: Connection,
    private readonly configService: ConfigService,
    private readonly studyService: StudyService,
    private readonly uploadJobService: UploadJobService,
  ) {
    this.serverConfig = this.configService.get<ServerConfig>("server");
  }

  /**
   * 배치 작업 중지
   * * 배치작업이 활성화 상태가 아닌 경우, 배치 작업 중지
   */
  @Timeout(0)
  stopJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    if (CronConfig.status !== CronStatus.ACTIVE) {
      jobs.forEach((job, name) => {
        job.stop();
        this.logger.log(`I: Stopped {${name}} cron job`);
      });
      return;
    }
    jobs.forEach((job, name) => {
      this.logger.log(`I: Called {${name}} cron job, schedule: ${CronConfig.schedule}`);
    });
    return;
  }

  /**
   * DB 암호화/복호화 실행
   * * 직후 1회 실행
   * * 실행 환경 변수: CronCryptoStatus 참고
   */
  @Timeout(0)
  async handleCronCrypto(): Promise<CronCryptoTaskDto | null> {
    this.logger.log(`I: Called {handleCronCrypto} once, Encryption Status: ${CronConfig.encryption} (oneOf: ${EncryptionStatus.ON}, ${EncryptionStatus.OFF})`);
    let result = null;
    if (this.serverConfig.encryptionMode) {
      result = await this.encryptAllInTransaction();
    } else {
      result = await this.decryptAllInTransaction();
    }
    return result;
  }

  async encryptAllInTransaction(): Promise<CronCryptoTaskDto> {
    const queryRunner = this.connection.createQueryRunner();
    const studyRepository = queryRunner.manager.getCustomRepository(StudyRepository);
    const uploadJobRepository = queryRunner.manager.getCustomRepository(UploadJobRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const studyResult = await this.studyService.encryptAll(studyRepository);
      const uploadJobResult = await this.uploadJobService.encryptAll(uploadJobRepository);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.logger.log(
        `암호화 성공 - Transaction Committed, result: ${JSON.stringify({
          studyResult,
          uploadJobResult,
        })}`,
      );
      return { studyResult };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        this.logger.error(`암호화 실패, Transaction Rollback, e: ${JSON.stringify(error.getResponse())}`);
      } else {
        this.logger.error(`암호화 실패, Transaction Rollback, e: ${JSON.stringify(error)}`);
      }
      throw new HttpException(HutomHttpException.CRYPTO_ERROR, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }

  async decryptAllInTransaction(): Promise<CronCryptoTaskDto> {
    const queryRunner = this.connection.createQueryRunner();

    const studyRepository = queryRunner.manager.getCustomRepository(StudyRepository);
    const uploadJobRepository = queryRunner.manager.getCustomRepository(UploadJobRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const studyResult = await this.studyService.decryptAll(studyRepository);
      const uploadJobResult = await this.uploadJobService.decryptAll(uploadJobRepository);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.logger.log(
        `복호화 성공 - Transaction Committed, result: ${JSON.stringify({
          studyResult,
          uploadJobResult,
        })}`,
      );
      return { studyResult };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        this.logger.error(`복호화 실패, Transaction Rollback, e: ${JSON.stringify(error.getResponse())}`);
      } else {
        this.logger.error(`복호화 실패, Transaction Rollback, e: ${JSON.stringify(error)}`);
      }
      throw new HttpException(HutomHttpException.CRYPTO_ERROR, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }
}
