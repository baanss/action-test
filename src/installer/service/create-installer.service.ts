import * as fs from "fs";
import * as path from "path";
import { Connection } from "typeorm";
import { Injectable, Logger } from "@nestjs/common";
import { InstallerRepository } from "@src/installer/repository/installer.repository";

@Injectable()
export class CreateInstallerSerivce {
  private readonly logger = new Logger(CreateInstallerSerivce.name);

  constructor(private connection: Connection) {}

  async createOne(file: Express.Multer.File): Promise<{ id: number }> {
    const queryRunner = this.connection.createQueryRunner();
    const installerRepository = queryRunner.manager.getCustomRepository(InstallerRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const originalFilepath = path.join(file.destination, file.originalname);

      const prevInstaller = await installerRepository.getLatestOne();
      if (prevInstaller?.filePath) {
        await installerRepository.deleteOneById(prevInstaller.id);
      }

      const createdOne = await installerRepository.createOne({
        fileName: file.originalname,
        filePath: originalFilepath,
        fileSize: file.size,
      });

      await fs.promises.rename(file.path, originalFilepath);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // 기존 파일이 존재하는 경우
      if (prevInstaller?.filePath) {
        await fs.promises
          .rm(prevInstaller.filePath)
          .then(() => {
            this.logger.log(`I: Succeeded in removing previous file(path:${prevInstaller.filePath})`);
          })
          .catch(() => {
            this.logger.log(`E: Failed to remove previous file(path:${prevInstaller.filePath})`);
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
