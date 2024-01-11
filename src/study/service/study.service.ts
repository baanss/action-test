import * as fs from "fs";
import * as path from "path";
import { Connection } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { HttpException, Injectable, Logger } from "@nestjs/common";

import { UtilService } from "@src/util/util.service";
import { Study } from "@src/common/entity/study.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ServerConfig } from "@src/common/config/configuration";
import { StudyRepository } from "@src/study/repository/study.repository";
import { GetAllStudyServiceReq, PostStudyServiceReq } from "@src/study/dto";
import { GetAllStorageStudyServiceReq } from "@src/storage/dto";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { Sex } from "@src/common/constant/enum.constant";

@Injectable()
export class StudyService {
  private readonly logger = new Logger(StudyService.name);
  private encryptionMode: boolean;

  constructor(
    private readonly connection: Connection,
    private readonly configService: ConfigService,
    private readonly studyRepository: StudyRepository,
    private readonly dicomRepository: DicomRepository,
    private readonly utilService: UtilService,
  ) {
    this.encryptionMode = this.configService.get<ServerConfig>("server").encryptionMode;
  }

  // 복호화 유틸
  private async decryptMany(studies: Study[]): Promise<Study[]> {
    return await studies.reduce(async (accPromise, study) => {
      const result: Study[] = await accPromise;
      if (!study) {
        return result;
      }
      const decrypted = await this.utilService.decryptPromise({ patientId: study.patientId, patientName: study.patientName });
      result.push({ ...study, patientId: decrypted.patientId, patientName: decrypted.patientName });
      return result;
    }, Promise.resolve([]));
  }

  async getManyAndCount(getAllStudyServiceReq: GetAllStudyServiceReq): Promise<[Study[], number]> {
    // 쿼리 암호화
    const { patientId, patientName, ...rest } = getAllStudyServiceReq;
    const encryptedQuery = await this.utilService.encryptPromise({ patientId, patientName });
    const [studies, studiesCount] = await this.studyRepository.getManyAndCount({
      patientId: encryptedQuery.patientId,
      patientName: encryptedQuery.patientName,
      ...rest,
    });
    // 복호화
    const decryptedStudies = await this.decryptMany(studies);
    return [decryptedStudies, studiesCount];
  }

  async getOneById(id: number): Promise<Study | null> {
    const study = await this.studyRepository.getOneById(id);
    if (!study) {
      return null;
    }

    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      return study;
    }

    // 암호화 모드:활성화(복호화 처리)
    const decrypted = await this.utilService.decryptPromise({ patientId: study.patientId, patientName: study.patientName });
    return { ...study, patientId: decrypted.patientId, patientName: decrypted.patientName };
  }

  // 파일을 가지는 스터디 리스트 조회하기
  async getManyAndCountWithFile(searchValue: GetAllStorageStudyServiceReq): Promise<[Study[], number]> {
    // 암호화 모드: 비활성화
    if (!this.encryptionMode) {
      const [studies, studiesCount] = await this.studyRepository.getManyAndCountWithFile(this.encryptionMode, searchValue);
      return [studies, studiesCount];
    }

    // 암호화 모드: 활성화
    const { patientId, patientName } = await this.utilService.encryptPromise({ patientId: searchValue.patientId, patientName: searchValue.patientName });
    const [studies, studiesCount] = await this.studyRepository.getManyAndCountWithFile(this.encryptionMode, { ...searchValue, patientId, patientName });
    const decryptedStudies = await this.decryptMany(studies);
    return [decryptedStudies, studiesCount];
  }

  async updateFile(studyId: number, fileInfo: { filePath: string; seriesCount: number; instancesCount: number }): Promise<void> {
    const { filePath, seriesCount, instancesCount } = fileInfo;
    // dicom 추가
    const fileName = path.basename(filePath);
    const duplicatedDicom = await this.dicomRepository.findOne({ fileName });
    if (duplicatedDicom) {
      throw new HttpException(HutomHttpException.DUPLICATED_FILE_NAME_ON_DB, HutomHttpException.DUPLICATED_FILE_NAME_ON_DB.statusCode);
    }
    let fileSize = null;
    try {
      const fStats = await fs.promises.stat(filePath);
      fileSize = fStats.size;
    } catch (error) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DICOM_ON_DISK, HutomHttpException.NOT_FOUND_DICOM_ON_DISK.statusCode);
    }

    const queryRunner = this.connection.createQueryRunner();

    const studyRepository = queryRunner.manager.getCustomRepository(StudyRepository);
    const dicomRepository = queryRunner.manager.getCustomRepository(DicomRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await dicomRepository.save({ studyId, filePath, fileName, fileSize });
      await studyRepository.updateFile(studyId, { seriesCount, instancesCount });

      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  // 전체 암호화 처리
  async encryptAll(sr?: StudyRepository): Promise<{ affected: number }> {
    const studyRepository = sr ? sr : this.studyRepository;

    const [studies, _] = await studyRepository.getAllAndCount();
    if (!studies.length) {
      return { affected: 0 };
    }
    // NOTE: 암호화 요청 1회 가능 -> 중복 암호화 요청 시, 예외 처리
    await this.utilService
      .decryptPromise({ patientId: studies[0].patientId, patientName: studies[0].patientName })
      .then(() => {
        this.logger.error(`Study 암호화 실패, e: 암호화 중복 요청`);
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
    try {
      const encryptedStudies = studies.map(async (study: Study) => {
        const encrypted = await this.utilService.encryptPromise({ patientId: study.patientId, patientName: study.patientName });
        const updated = await studyRepository.updatePatient(study.id, encrypted);
        return updated?.affected ? updated.raw[0].id : null;
      });
      const result = await Promise.all(encryptedStudies);
      const affected = result.reduce((acc, curr) => (curr ? (acc += 1) : acc), 0);

      this.logger.log(`Study 암호화 성공, id: ${JSON.stringify(result)}, affected: ${affected}`);
      return { affected };
    } catch (error) {
      this.logger.error(`Study 암호화 실패, e: ${JSON.stringify(error)}`);
      throw new HttpException({ ...HutomHttpException.CRYPTO_ERROR, message: "Study 암호화 실패" }, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }

  // 전체 복호화 처리
  async decryptAll(sr?: StudyRepository): Promise<{ affected: number }> {
    const studyRepository = sr ? sr : this.studyRepository;

    const [studies, _] = await studyRepository.getAllAndCount();
    if (!studies.length) {
      return { affected: 0 };
    }
    try {
      const decryptedStudies = studies.map(async (study) => {
        const decrypted = await this.utilService.decryptPromise({ patientId: study.patientId, patientName: study.patientName });
        const updated = await studyRepository.updatePatient(study.id, decrypted);
        return updated?.affected ? updated.raw[0].id : null;
      });
      const result = await Promise.all(decryptedStudies);
      const affected = result.reduce((acc, curr) => (curr ? (acc += 1) : acc), 0);

      this.logger.log(`Study 복호화 성공, id: ${JSON.stringify(result)}, affected: ${affected}`);
      return { affected };
    } catch (error) {
      this.logger.error(`Study 복호화 실패, e: ${JSON.stringify(error)}`);
      throw new HttpException({ ...HutomHttpException.CRYPTO_ERROR, message: "Study 복호화 실패" }, HutomHttpException.CRYPTO_ERROR.statusCode);
    }
  }

  async createOne(dto: PostStudyServiceReq): Promise<{ id: number }> {
    const { uploadJobId, huId, studyDate, studyTime, age, sex, studyDescription, patientId, patientName, seriesCount, instancesCount } = dto;

    const dateStudy = this.utilService.dateTransformer(studyDate ?? "19000101", studyTime ?? "000000");
    let parsedAge = null;
    if (age) {
      parsedAge = age.endsWith("Y") ? parseInt(age) : 0;
    }
    let studyDto = {
      uploadJobId,
      huId,
      studyDate: dateStudy,
      age: parsedAge,
      sex: Object.values(Sex).includes(sex) ? sex : null,
      studyDescription: studyDescription ?? "UNKNOWN",
      patientId: patientId ?? "UNKNOWN",
      patientName: patientName ?? "UNKNOWN",
      seriesCount: seriesCount ?? 0,
      instancesCount: instancesCount ?? 0,
    };

    // huId 중복 검사
    const duplicatedStudy = await this.studyRepository.findOne({ huId });
    if (duplicatedStudy) {
      throw new HttpException(HutomHttpException.DUPLICATED_STUDY_WITH_HUID, HutomHttpException.DUPLICATED_STUDY_WITH_HUID.statusCode);
    }

    if (this.encryptionMode) {
      const encrypted = await this.utilService.encryptPromise({ patientId: studyDto.patientId, patientName: studyDto.patientName });
      studyDto = { ...studyDto, patientId: encrypted.patientId, patientName: encrypted.patientName };
    }
    const study = await this.studyRepository.createOne(studyDto);
    return { id: study.id };
  }
}
