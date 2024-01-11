import * as moment from "moment";
import * as path from "path";
import * as fs from "fs";
import { Connection } from "typeorm";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CoreConfig, QrConfig, ServerConfig } from "@src/common/config/configuration";
import { UploadJob } from "@src/common/entity/upload-job.entity";
import { CreateUploadJobServiceReq, PatchUploadJobServiceReq } from "@src/upload-job/dto";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { AeMode, OrderQuery, UploadJobStatus } from "@src/common/constant/enum.constant";
import { GetUploadJobHuIdServiceRes } from "@src/upload-job/dto/out/get-upload-job-hu-id.service-response.dto";
import { UtilService } from "@src/util/util.service";

@Injectable()
export class UploadJobService {
  private readonly logger = new Logger(UploadJobService.name);
  private encryptionMode: boolean;
  private coreConfig: CoreConfig;
  private qrConfig: QrConfig;
  constructor(
    private readonly conenction: Connection,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    private readonly uploadJobRepository: UploadJobRepository,
  ) {
    this.encryptionMode = this.configService.get<ServerConfig>("server").encryptionMode;
    this.coreConfig = this.configService.get<CoreConfig>("core");
    this.qrConfig = this.configService.get<QrConfig>("qr");
  }

  getStatus(dto: { status: string; studyId: number; aeMode: string; createdAt: Date }): UploadJobStatus {
    const { studyId, aeMode, status, createdAt } = dto;
    // 로컬 업로드
    if (!aeMode) {
      return UploadJobStatus[status];
    }
    // dicom-server 업로드
    if (!!studyId) {
      return UploadJobStatus.DONE;
    }
    if (status === UploadJobStatus.REJECT) {
      return UploadJobStatus.REJECT;
    }
    if (moment(createdAt).toISOString() < moment().subtract(this.qrConfig.timeoutMs, "ms").toISOString()) {
      return UploadJobStatus.REJECT;
    }
    return UploadJobStatus.IN_PROGRESS;
  }

  // 하나 조회하기
  findById(id: number): Promise<UploadJob> {
    return this.uploadJobRepository.findById(id);
  }

  // 하나 조회하기
  getOne(dto: { huId: string }): Promise<UploadJob> {
    return this.uploadJobRepository.findOne(dto);
  }

  /**
   * huId 조회하고, 없으면 생성하기
   * 유효 조건
   * 1. studyInstanceUID: 일치
   * 2. createdAt: 1시간이 지나지 않음
   * 3. studyId: study 등록되지 않음
   * 4. status: reject 아님
   * @param studyInstanceUID
   * @returns GetUploadJobHuIdServiceRes
   */
  async getOrCreateHuId(studyInstanceUID: string): Promise<GetUploadJobHuIdServiceRes> {
    const uploadJobs = await this.uploadJobRepository.findMany({ studyInstanceUID });

    const validUploadJob = uploadJobs.find((uploadJob) => {
      const status = this.getStatus(uploadJob);
      return status === UploadJobStatus.IN_PROGRESS && !!uploadJob.aeMode;
    });
    // 존재하지 않는 경우, 생성
    if (!validUploadJob) {
      const uploadJob = await this.createOne({ aeMode: AeMode.SCP, isAquired: true, studyInstanceUID });
      return { huId: uploadJob.huId, instancesCount: null, affected: 1 };
    }
    // upload-job 할당 이전(최초 할당)
    if (!validUploadJob.isAquired) {
      await this.updateById(validUploadJob.id, { isAquired: true, studyInstanceUID });
      return { huId: validUploadJob.huId, instancesCount: validUploadJob.instancesCount, affected: 1 };
    }
    // upload-job 할당 이후(중복 할당)
    return { huId: validUploadJob.huId, instancesCount: validUploadJob.instancesCount, affected: 0 };
  }

  // 하나 생성하기
  async createOne(dto: CreateUploadJobServiceReq): Promise<{ id: number; huId: string }> {
    const { patientId, patientName, age, ...rest } = dto;

    const queryRunner = this.conenction.createQueryRunner();

    const uploadJobRepository = queryRunner.manager.getCustomRepository(UploadJobRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // huId 생성
      const huId = await this.generateHuId();
      // upload-job 생성
      let parsedAge = 0;
      if (age && age.includes("Y")) {
        parsedAge = parseInt(age);
      }
      let insertDto = { ...rest, age: parsedAge, huId, patientId, patientName };
      if (this.encryptionMode) {
        const encrypted = await this.utilService.encryptPromise({ patientId, patientName });
        insertDto = {
          ...insertDto,
          patientId: encrypted.patientId,
          patientName: encrypted.patientName,
        };
      }
      const uploadJob = await uploadJobRepository.createOne(insertDto);

      // huId 파일 저장 경로 생성
      const uploadIdPath = path.join(this.coreConfig.dicomPath, huId);
      await fs.promises.mkdir(uploadIdPath, { recursive: true });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { id: uploadJob.id, huId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  /**
   * 하나 수정하기
   * @param id number DB id
   * @param updateUploadJobServiceReq PatchUploadJobServiceReq 수정 대상 {studyId, status, message, isAquired, studyInstanceUID}
   * @returns UploadJob
   */
  async updateById(id: number, updateUploadJobServiceReq: PatchUploadJobServiceReq): Promise<UploadJob> {
    // 하나 수정하기
    const updatedOne = await this.uploadJobRepository.updateOneById(id, updateUploadJobServiceReq);
    if (!updatedOne?.affected) {
      throw new HttpException(HutomHttpException.UPDATE_DATA_ERROR, HutomHttpException.UPDATE_DATA_ERROR.statusCode);
    }
    return updatedOne.raw[0];
  }

  // huId 생성하기
  private async generateHuId(): Promise<string> {
    let huId = `${this.coreConfig.serverCode}_${this.coreConfig.huIdStartIndex}`;
    const uploadJob = await this.uploadJobRepository.getOneByServerCode({ order: OrderQuery.DESC, serverCode: this.coreConfig.serverCode });
    // uploadJob이 조회되지 않는 경우
    if (!uploadJob) {
      return huId;
    }
    // SERVER_CODE 값이 변경된 경우 index는 환경변수로 설정한 값부터 시작됨
    const index = uploadJob.huId.replace(`${this.coreConfig.serverCode}_`, "");
    if (!!Number(index)) {
      huId = `${this.coreConfig.serverCode}_${Number(index) + 1}`;
      return huId;
    }
    return huId;
  }

  // 전체 암호화 처리
  async encryptAll(ur?: UploadJobRepository): Promise<{ affected: number }> {
    const uploadJobRepository = ur ? ur : this.uploadJobRepository;

    const [uploadJobs, _] = await uploadJobRepository.getAllAndCount();
    if (!uploadJobs.length) {
      return { affected: 0 };
    }
    // NOTE: 암호화 요청 1회 가능 -> 중복 암호화 요청 시, 예외 처리
    const uploadJobWithPatientInfo = uploadJobs.find((uploadJob) => !!uploadJob.patientId || !!uploadJob.patientName);
    if (uploadJobWithPatientInfo) {
      await this.utilService
        .decryptPromise({ patientId: uploadJobWithPatientInfo.patientId, patientName: uploadJobWithPatientInfo.patientName })
        .then(() => {
          this.logger.error(`UploadJob 암호화 실패, e: 암호화 중복 요청`);
          throw new HttpException({ ...HutomHttpException.BAD_REQUEST, message: "암호화 중복 요청" }, HutomHttpException.BAD_REQUEST.statusCode);
        })
        .catch((error) => {
          if (error.getResponse()?.error === HutomHttpException.CRYPTO_ERROR.error) {
            return;
          }
          if (error instanceof HttpException) {
            throw error;
          }
        });
    }
    try {
      const encryptedUploadJobs = uploadJobs.map(async (uploadJob: UploadJob) => {
        const encrypted = await this.utilService.encryptPromise({ patientId: uploadJob.patientId, patientName: uploadJob.patientName });
        const updated = await uploadJobRepository.updatePatient(uploadJob.id, encrypted);
        return updated?.affected ? updated.raw[0].id : null;
      });
      const result = await Promise.all(encryptedUploadJobs);
      const affected = result.reduce((acc, curr) => (curr ? (acc += 1) : acc), 0);

      this.logger.log(`UploadJob 암호화 성공, id: ${JSON.stringify(result)}, affected: ${affected}`);
      return { affected };
    } catch (error) {
      this.logger.error(`UploadJob 암호화 실패, e: ${JSON.stringify(error)}`);
      throw new HttpException({ ...HutomHttpException.CRYPTO_ERROR, message: "UploadJob 암호화 실패" }, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }

  // 전체 복호화 처리
  async decryptAll(ur?: UploadJobRepository): Promise<{ affected: number }> {
    const uploadJobRepository = ur ? ur : this.uploadJobRepository;

    const [uploadJobs, _] = await uploadJobRepository.getAllAndCount();
    if (!uploadJobs.length) {
      return { affected: 0 };
    }
    try {
      const encryptedUploadJobs = uploadJobs.map(async (study) => {
        const decrypted = await this.utilService.decryptPromise({ patientId: study.patientId, patientName: study.patientName });
        const updated = await uploadJobRepository.updatePatient(study.id, decrypted);
        return updated?.affected ? updated.raw[0].id : null;
      });
      const result = await Promise.all(encryptedUploadJobs);
      const affected = result.reduce((acc, curr) => (curr ? (acc += 1) : acc), 0);

      this.logger.log(`UploadJob 복호화 성공, id: ${JSON.stringify(result)}, affected: ${affected}`);
      return { affected };
    } catch (error) {
      this.logger.error(`UploadJob 복호화 실패, e: ${JSON.stringify(error)}`);
      throw new HttpException({ ...HutomHttpException.CRYPTO_ERROR, message: "UploadJob 복호화 실패" }, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }
}
