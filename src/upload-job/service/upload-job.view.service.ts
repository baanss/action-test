import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { UploadJobView } from "@src/common/entity/upload-job.view.entity";
import { ServerConfig } from "@src/common/config/configuration";
import { UtilService } from "@src/util/util.service";
import { UploadJobViewRepository } from "@src/upload-job/repository/upload-job.view.repository";
import { GetAllUploadJobViewServiceReq } from "@src/upload-job/dto/in/get-all-upload-job.view.service-request.dto";

@Injectable()
export class UploadJobViewService {
  private encryptionMode: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    private readonly uploadJobViewRepository: UploadJobViewRepository
  ) {
    this.encryptionMode = this.configService.get<ServerConfig>("server").encryptionMode;
  }

  // 여러개 조회하기(리소스 접근권한 필요)
  async getOwnManyAndCount(userId: number, searchValue: GetAllUploadJobViewServiceReq): Promise<[UploadJobView[], number]> {
    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      const [uploadJobs, count] = await this.uploadJobViewRepository.getOwnManyAndCount(this.encryptionMode, userId, {
        ...searchValue,
        isDicomFileNotDeleted: true,
      });
      return [uploadJobs, count];
    }

    // 암호화 모드:활성화
    const { patientId, patientName } = await this.utilService.encryptPromise({ patientId: searchValue.patientId, patientName: searchValue.patientName });
    const [uploadJobs, count] = await this.uploadJobViewRepository.getOwnManyAndCount(this.encryptionMode, userId, {
      ...searchValue,
      patientId,
      patientName,
      isDicomFileNotDeleted: true,
    });
    const decryptedList = await this.decryptMany(uploadJobs);
    return [decryptedList, count];
  }

  // 여러개 조회하기(리소스 접근권한 필요없음)
  async getManyAndCount(searchValue: GetAllUploadJobViewServiceReq): Promise<[UploadJobView[], number]> {
    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      const [uploadJobs, count] = await this.uploadJobViewRepository.getManyAndCount(this.encryptionMode, { ...searchValue, isDicomFileNotDeleted: true });
      return [uploadJobs, count];
    }

    // 암호화 모드:활성화
    const { patientId, patientName } = await this.utilService.encryptPromise({ patientId: searchValue.patientId, patientName: searchValue.patientName });
    const [uploadJobs, count] = await this.uploadJobViewRepository.getManyAndCount(this.encryptionMode, {
      ...searchValue,
      patientId,
      patientName,
      isDicomFileNotDeleted: true,
    });
    const decryptedList = await this.decryptMany(uploadJobs);
    return [decryptedList, count];
  }

  // 복호화 처리
  private async decryptMany(uploadJobViews: UploadJobView[]): Promise<UploadJobView[]> {
    return await uploadJobViews.reduce(async (accPromise, uploadJobView) => {
      const result: UploadJobView[] = await accPromise;
      if (!uploadJobView) {
        return result;
      }
      const decryptedStudy = await this.utilService.decryptPromise({ patientId: uploadJobView.studyPatientId, patientName: uploadJobView.studyPatientName });
      const decryptedUploadJob = await this.utilService.decryptPromise({ patientId: uploadJobView.patientId, patientName: uploadJobView.patientName });
      result.push({
        ...uploadJobView,
        patientId: decryptedUploadJob.patientId,
        patientName: decryptedUploadJob.patientName,
        studyPatientId: decryptedStudy.patientId,
        studyPatientName: decryptedStudy.patientName,
      });
      return result;
    }, Promise.resolve([]));
  }
}
