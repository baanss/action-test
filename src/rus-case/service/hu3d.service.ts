import * as fs from "fs";
import { Connection } from "typeorm";
import { HttpException, Injectable, Logger } from "@nestjs/common";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { Hu3dRepository } from "@src/rus-case/repository/hu3d.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";
import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { CreateHu3dServiceReq, UpdateHu3dServiceReq } from "@src/rus-case/dto";

@Injectable()
export class Hu3dService {
  private readonly logger = new Logger(Hu3dService.name);
  constructor(private readonly connection: Connection, private readonly hu3dRepository: Hu3dRepository) {}

  async deleteFileByStudyId(studyId: number, withNotification?: { requestorId: number }): Promise<string> {
    const hu3d = await this.hu3dRepository.getOneByStudyId(studyId);
    if (!hu3d || !hu3d.filePath) {
      throw new HttpException(HutomHttpException.NOT_FOUND_HU3D_WITH_STUDY_ID, HutomHttpException.NOT_FOUND_HU3D_WITH_STUDY_ID.statusCode);
    }

    await fs.promises
      .rm(hu3d.filePath)
      .then(() => this.logger.log(`I: Succeeded in removing a hu3D file(path:${hu3d.filePath})`))
      .catch((error) => this.logger.log(`E: Failed to remove a hu3D file(path:${hu3d.filePath}), e: ${error}`));

    const queryRunner = this.connection.createQueryRunner();

    const rusCaseRepository = queryRunner.manager.getCustomRepository(RusCaseRepository);
    const hu3dRepository = queryRunner.manager.getCustomRepository(Hu3dRepository);
    const notificationRepository = queryRunner.manager.getCustomRepository(NotificationRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await hu3dRepository.deleteFileById(hu3d.id);
      if (withNotification) {
        const rusCase = await rusCaseRepository.getOneByStudyId(studyId);
        if (rusCase && rusCase.userId && rusCase.userId !== withNotification?.requestorId) {
          await notificationRepository.createOne({ userId: rusCase.userId, category: Category.HU3D_DELETED, huId: rusCase.study.huId });
        }
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return hu3d.fileName;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw { error, hu3d };
    }
  }

  async createOne(dto: CreateHu3dServiceReq): Promise<{ id: number }> {
    const { rusCaseWithStudy, tempFilePath, filePath, fileName, fileSize, requestorId } = dto;

    const queryRunner = this.connection.createQueryRunner();

    const hu3dRepository = queryRunner.manager.getCustomRepository(Hu3dRepository);
    const rusCaseRepository = queryRunner.manager.getCustomRepository(RusCaseRepository);
    const notificationRepository = queryRunner.manager.getCustomRepository(NotificationRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await hu3dRepository.createOne({ rusCaseId: rusCaseWithStudy.id, filePath, fileName, fileSize });
      await rusCaseRepository.updateOneById(rusCaseWithStudy.id, { status: RusCaseStatus.DONE });
      if (rusCaseWithStudy.userId !== requestorId) {
        await notificationRepository.createOne({ userId: rusCaseWithStudy.userId, category: Category.HU3D_COMPLETED, huId: rusCaseWithStudy.study.huId });
      }
      await fs.promises.rename(tempFilePath, filePath);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { id: rusCaseWithStudy.id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      // 중복 요청
      if (error.code === "23505") {
        throw new HttpException(HutomHttpException.DUPLICATED_FILE_NAME_ON_DB, HutomHttpException.DUPLICATED_FILE_NAME_ON_DB.statusCode);
      }
      throw error;
    }
  }

  async updateFile(id: number, dto: UpdateHu3dServiceReq): Promise<{ id: number }> {
    const { rusCaseWithStudy, tempFilePath, filePath, fileName, fileSize, version, requestorId } = dto;

    const queryRunner = this.connection.createQueryRunner();

    const hu3dRepository = queryRunner.manager.getCustomRepository(Hu3dRepository);
    const rusCaseRepository = queryRunner.manager.getCustomRepository(RusCaseRepository);
    const notificationRepository = queryRunner.manager.getCustomRepository(NotificationRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await hu3dRepository.updateOne(id, { filePath, fileName, fileSize, version });
      await rusCaseRepository.updateOneById(rusCaseWithStudy.id, { status: RusCaseStatus.DONE });
      if (rusCaseWithStudy.userId !== requestorId) {
        await notificationRepository.createOne({ userId: rusCaseWithStudy.userId, category: Category.HU3D_UPDATED, huId: rusCaseWithStudy.study.huId });
      }
      await fs.promises.rename(tempFilePath, filePath);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { id: rusCaseWithStudy.id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      // 중복 요청
      if (error.code === "23505") {
        throw new HttpException(HutomHttpException.DUPLICATED_FILE_NAME_ON_DB, HutomHttpException.DUPLICATED_FILE_NAME_ON_DB.statusCode);
      }
      throw error;
    }
  }
}
