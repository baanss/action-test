import * as fs from "fs";
import * as path from "path";
import checkDiskSpace from "check-disk-space";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CoreConfig } from "@src/common/config/configuration";
import { StorageStatusDto } from "@src/storage/dto/storage.dto";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { FailedDeleteFileDto } from "@src/storage/dto";
import { FileType, LogType, ServiceType } from "@src/common/constant/enum.constant";
import { Hu3dService } from "@src/rus-case/service/hu3d.service";
import { DicomService } from "@src/study/service/dicom.service";
import { LoggerService } from "@src/logger/logger.service";
import { User } from "@src/common/entity/user.entity";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private coreConfig: CoreConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly dicomService: DicomService,
    private readonly hu3dService: Hu3dService,
    private readonly loggerService: LoggerService,
  ) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
  }

  // 디렉토리 파일리스트 구하기
  private async readDeepDir(directory: string): Promise<Array<any>> {
    const dirents = await fs.promises.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const nodePath = path.resolve(directory, dirent.name);
        const fStat = fs.promises.stat(nodePath);
        return dirent.isDirectory() ? await this.readDeepDir(nodePath) : fStat;
      }),
    );
    return Array.prototype.concat(...files);
  }

  // 디렉토리 사이즈 구하기
  private async getDirSize(directory: string): Promise<number> {
    try {
      const files = await this.readDeepDir(directory);
      return files.reduce((acc, { size }) => acc + size, 0);
    } catch (error) {
      await fs.promises.mkdir(directory);
      return 0;
    }
  }

  // 저장소 상태 조회하기
  async getStorageStatus(): Promise<StorageStatusDto> {
    const { free, size } = await checkDiskSpace(this.coreConfig.storagePath);
    const ctUsed = await this.getDirSize(this.coreConfig.dicomPath);
    const hu3dUsed = await this.getDirSize(this.coreConfig.hu3dPath);
    const etcUsed = size - free - (ctUsed + hu3dUsed);
    return { total: size, free, ctUsed, hu3dUsed, etcUsed };
  }

  // 파일 삭제하기
  async deleteFiles(studyIds: number[], types: FileType[], user: User): Promise<{ success: number[]; failed: FailedDeleteFileDto[] }> {
    const deleteFiles = studyIds.reduce((acc, studyId) => {
      if (types.includes(FileType.CT)) {
        const deleteOne = this.dicomService
          .deleteFileByStudyId(studyId, { requestorId: user.id })
          .then((fileName) => {
            this.loggerService.log(ServiceType.USER, user.employeeId, LogType.DELETE_FILE, fileName);
            return studyId;
          })
          .catch((error) => {
            throw new HttpException(
              {
                id: studyId,
                type: FileType.CT,
                fileName: error.getResponse()["fileName"] ?? null,
                error: error.getResponse()["error"] ?? HutomHttpException.UNEXPECTED_ERROR.error,
              },
              error.getStatus() ?? HutomHttpException.UNEXPECTED_ERROR.statusCode,
            );
          });
        acc.push(deleteOne);
      }
      if (types.includes(FileType.HU3D)) {
        const deleteOne = this.hu3dService
          .deleteFileByStudyId(studyId, { requestorId: user.id })
          .then((fileName) => {
            this.loggerService.log(ServiceType.USER, user.employeeId, LogType.DELETE_FILE, fileName);
            return studyId;
          })
          .catch((error) => {
            throw new HttpException(
              {
                id: studyId,
                type: FileType.HU3D,
                fileName: error.getResponse()["fileName"] ?? null,
                error: error.getResponse()["error"] ?? HutomHttpException.UNEXPECTED_ERROR.error,
              },
              error.getStatus() ?? HutomHttpException.UNEXPECTED_ERROR.statusCode,
            );
          });
        acc.push(deleteOne);
      }
      return acc;
    }, []);

    const success = [];
    const failed = [];
    await Promise.allSettled(deleteFiles).then((result) => {
      result.forEach((result) => {
        if (result.status === "fulfilled") {
          success.push(result.value);
        } else {
          failed.push(result.reason.response);
        }
      });
    });

    return { success, failed };
  }
}
