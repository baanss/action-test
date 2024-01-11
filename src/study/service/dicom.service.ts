import * as fs from "fs";
import { Connection } from "typeorm";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { Category } from "@src/common/entity/notification.entity";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { FileType } from "@src/common/constant/enum.constant";

@Injectable()
export class DicomService {
  private readonly logger = new Logger(DicomService.name);
  constructor(
    private readonly connection: Connection,
    private readonly dicomRepository: DicomRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {}

  // 다이콤 파일 삭제
  async deleteFileByStudyId(studyId: number, withNotification?: { requestorId: number }): Promise<string> {
    const dicom = await this.dicomRepository.getOneByStudyId(studyId);
    if (!dicom || !dicom.filePath) {
      throw new HttpException(
        { ...HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID, fileName: null },
        HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID.statusCode,
      );
    }
    await fs.promises
      .rm(dicom.filePath)
      .then(() => this.logger.log(`I: Succeeded in removing CT file(path:${dicom.filePath})`))
      .catch((error) => this.logger.log(`E: Failed to remove CT file(path:${dicom.filePath}), e: ${error}`));

    const queryRunner = this.connection.createQueryRunner();

    const rusCaseRepository = queryRunner.manager.getCustomRepository(RusCaseRepository);
    const dicomRepository = queryRunner.manager.getCustomRepository(DicomRepository);
    const notificationRepository = queryRunner.manager.getCustomRepository(NotificationRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await dicomRepository.deleteFileById(dicom.id);
      if (withNotification) {
        const rusCase = await rusCaseRepository.getOneByStudyId(studyId);
        if (rusCase && rusCase.userId && rusCase.userId !== withNotification.requestorId) {
          await notificationRepository.createOne({ userId: rusCase.userId, category: Category.CT_DELETED, huId: rusCase.study.huId });
        }
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return dicom.fileName;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      if (error instanceof HttpException) {
        throw new HttpException(
          {
            id: studyId,
            type: FileType.CT,
            fileName: dicom.fileName,
            error: error.getResponse()["error"],
          },
          error.getStatus(),
        );
      }
      throw new HttpException(
        { id: studyId, type: FileType.CT, fileName: dicom.fileName, error: HutomHttpException.UNEXPECTED_ERROR.error },
        HutomHttpException.UNEXPECTED_ERROR.statusCode,
      );
    }
  }

  // 다이콤 파일 삭제
  async deleteFileById(id: number, withNotification?: { userId: number; huId: string }): Promise<void> {
    const dicom = await this.dicomRepository.getOneById(id);
    if (!dicom) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID, HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID.statusCode);
    }

    try {
      await fs.promises.rm(dicom.filePath);
      this.logger.log(`I: Succeeded in removing CT file(path:${dicom.filePath})`);
    } catch (error) {
      this.logger.log(`E: Failed to remove CT file(path:${dicom.filePath}), e: ${error}`);
    }

    if (withNotification) {
      await this.notificationRepository.createOne({
        category: Category.CT_DELETED,
        userId: withNotification.userId,
        huId: withNotification.huId,
      });
    }

    await this.dicomRepository.deleteFileById(id);
  }
}
