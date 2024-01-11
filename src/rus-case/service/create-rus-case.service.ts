import * as fs from "fs";
import { Connection } from "typeorm";
import { HttpException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ClinicalInfoRepository } from "@src/rus-case/repository/clinical-info.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { StudyRepository } from "@src/study/repository/study.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { ServerConfig } from "@src/common/config/configuration";
import { PostRusCaseServiceReq } from "@src/rus-case/dto";
import { UtilService } from "@src/util/util.service";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";

@Injectable()
export class CreateRusCaseService {
  private encryptionMode: boolean;
  constructor(
    private readonly connection: Connection,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    private readonly studyRepository: StudyRepository,
    private readonly totalCreditViewRepository: TotalCreditViewRepository,
  ) {
    this.encryptionMode = this.configService.get<ServerConfig>("server").encryptionMode;
  }

  // RusCase 레코드 생성
  async createOne(postRusCaseServiceReq: PostRusCaseServiceReq): Promise<{ id: number }> {
    const { studyId, userId, surgeonId, patientName, ...rest } = postRusCaseServiceReq;
    const totalCredit = await this.totalCreditViewRepository.getTotalCredit();
    // 크레딧이 부족한 경우
    if (totalCredit < 1) {
      throw new HttpException(HutomHttpException.INSUFFICIENT_CREDIT, HutomHttpException.INSUFFICIENT_CREDIT.statusCode);
    }
    const study = await this.studyRepository.getOneById(studyId);
    // 스터디가 존재하지 않는 경우
    if (!study) {
      throw new HttpException(HutomHttpException.NOT_FOUND_STUDY_WITH_ID, HutomHttpException.NOT_FOUND_STUDY_WITH_ID.statusCode);
    }
    // 다이콤 파일이 제거된 경우
    if (!study.dicom.filePath) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DICOM_ON_DB, HutomHttpException.NOT_FOUND_DICOM_ON_DB.statusCode);
    }
    // DICOM 파일 존재 여부 확인(디스크)
    try {
      await fs.promises.access(study.dicom.filePath);
    } catch (error) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DICOM_ON_DISK, HutomHttpException.NOT_FOUND_DICOM_ON_DISK.statusCode);
    }
    // 이미 등록된 경우
    if (study.isRegistered) {
      throw new HttpException(HutomHttpException.DUPLICATED_RUS_CASE_ON_DB, HutomHttpException.DUPLICATED_RUS_CASE_ON_DB.statusCode);
    }
    // patientName 암호화
    const updateStudyDto = { patientName, isRegistered: true };
    if (this.encryptionMode) {
      const encrypted = await this.utilService.encryptPromise({ patientName });
      updateStudyDto.patientName = encrypted.patientName;
    }

    const queryRunner = this.connection.createQueryRunner();

    const rusCaseRepository = queryRunner.manager.getCustomRepository(RusCaseRepository);
    const clinicalInfoRepository = queryRunner.manager.getCustomRepository(ClinicalInfoRepository);
    const studyRepository = queryRunner.manager.getCustomRepository(StudyRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await studyRepository.update(study.id, updateStudyDto);
      const rusCaseId = await rusCaseRepository.createOne({ studyId, userId, surgeonId });
      await clinicalInfoRepository.createOne({ rusCaseId, ...rest });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { id: rusCaseId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      // 중복 요청
      if (error.code === "23505") {
        throw new HttpException(HutomHttpException.DUPLICATED_RUS_CASE_ON_DB, HutomHttpException.DUPLICATED_RUS_CASE_ON_DB.statusCode);
      }
      throw error;
    }
  }
}
