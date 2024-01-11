import * as fs from "fs";
import * as path from "path";
import { Connection } from "typeorm";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { UpdateLogRepository } from "@src/update-log/repository/update-log.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@Injectable()
export class CreateUpdateLogService {
  private readonly logger = new Logger(CreateUpdateLogService.name);

  constructor(private connection: Connection) {}

  async createOne(file: Express.Multer.File): Promise<{ id: number }> {
    const queryRunner = this.connection.createQueryRunner();
    const updateLogRepository = queryRunner.manager.getCustomRepository(UpdateLogRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const originalFilepath = path.join(file.destination, file.originalname);

      const prevUpdateLogs = await updateLogRepository.getLatestOne();
      if (prevUpdateLogs?.filePath) {
        await updateLogRepository.deleteOneById(prevUpdateLogs.id);
      }

      // 엔티티 추가
      const createdOne = await updateLogRepository.createOne({
        fileName: file.originalname,
        filePath: originalFilepath,
        fileSize: file.size,
      });

      // 파일명 업데이트
      await fs.promises.rename(file.path, originalFilepath);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      if (prevUpdateLogs?.filePath) {
        await fs.promises
          .rm(prevUpdateLogs.filePath)
          .then(() => {
            this.logger.log(`I: Succeeded in removing previous file(path:${prevUpdateLogs.filePath})`);
          })
          .catch(() => {
            this.logger.log(`E: Failed to remove previous file(path:${prevUpdateLogs.filePath})`);
          });
      }

      return { id: createdOne.id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }
}
