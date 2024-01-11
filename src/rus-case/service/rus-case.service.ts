import * as fs from "fs";
import * as path from "path";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Connection, In } from "typeorm";

import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { RusCase } from "@src/common/entity/rus-case.entity";
import { Category } from "@src/common/entity/notification.entity";
import { Hu3d } from "@src/common/entity/hu3d.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CoreConfig, ServerConfig } from "@src/common/config/configuration";
import { UtilService } from "@src/util/util.service";

import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { CloudService } from "@src/cloud/service/cloud.service";
import { CreditHistoryService } from "@src/credit-history/service/credit-history.service";
import { UserRepository } from "@src/user/repository/user.repository";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { DicomService } from "@src/study/service/dicom.service";
import { RecipientRepository } from "@src/recipient/repository/recipient.repository";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";

import { Hu3dService } from "@src/rus-case/service/hu3d.service";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { ClinicalInfoRepository } from "@src/rus-case/repository/clinical-info.repository";

import { GetAllRusCaseServiceReq, PatchRusCaseServiceReq, PatchRusCaseServiceRes } from "@src/rus-case/dto";
import { CreateHuctDto } from "@src/rus-case/dto/huct.dto";

@Injectable()
export class RusCaseService {
  private readonly logger = new Logger(RusCaseService.name);
  private coreConfig: CoreConfig;
  private encryptionMode: boolean;

  constructor(
    private readonly connection: Connection,
    private readonly configService: ConfigService,
    private readonly cloudService: CloudService,
    private readonly creditHistoryService: CreditHistoryService,
    private readonly utilService: UtilService,
    private readonly dicomService: DicomService,
    private readonly hu3dService: Hu3dService,
    private readonly recipientRepository: RecipientRepository,
    private readonly totalCreditRepository: TotalCreditViewRepository,
    private readonly rusCaseRepository: RusCaseRepository,
    private readonly userRepository: UserRepository,
    private readonly clinicalInfoRepository: ClinicalInfoRepository,
  ) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
    this.encryptionMode = this.configService.get<ServerConfig>("server").encryptionMode;
  }

  // 복호화 유틸
  private async decryptRusCases(rusCases: RusCase[]): Promise<RusCase[]> {
    return await rusCases.reduce(async (accPromise, rusCase) => {
      const result = await accPromise;
      if (!rusCase) {
        return result;
      }
      const { patientId, patientName } = await this.utilService.decryptPromise({ patientId: rusCase.study.patientId, patientName: rusCase.study.patientName });
      result.push({ ...rusCase, study: { ...rusCase.study, patientId, patientName } });
      return result;
    }, Promise.resolve([]));
  }

  /**
   * huCT 생성
   * @param rusCaseId number RusCase DB id
   * @param recipientIds number[] Recipient DB id
   * @returns [CreateHuctDto, dicomFilePath: string]
   */
  async generateHuct(rusCaseId: number, recipientIds?: number[]): Promise<[CreateHuctDto, string]> {
    const totalCredit = await this.totalCreditRepository.getTotalCredit();
    const rusCase = await this.rusCaseRepository.getOneById(rusCaseId);
    let huCT: CreateHuctDto;
    if (recipientIds) {
      const recipients = await this.recipientRepository.find({ id: In(recipientIds) });
      const userEmail = rusCase.user?.email;
      huCT = CreateHuctDto.from(rusCase, this.coreConfig.serverCode, { creditBalance: totalCredit, recipients, userEmail });
    } else {
      huCT = CreateHuctDto.from(rusCase, this.coreConfig.serverCode, { creditBalance: totalCredit });
    }
    return [huCT, rusCase.study.dicom.filePath];
  }

  // 여러개 조회하기(리소스 접근권한 필요없음)
  async getManyAndCount(searchValue: GetAllRusCaseServiceReq): Promise<[RusCase[], number]> {
    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      const [rusCases, rusCasesCount] = await this.rusCaseRepository.getManyAndCount(this.encryptionMode, searchValue);
      return [rusCases, rusCasesCount];
    }

    // 암호화 모드:활성화
    const { patientId, patientName } = await this.utilService.encryptPromise({ patientId: searchValue.patientId, patientName: searchValue.patientName });
    const [rusCases, rusCasesCount] = await this.rusCaseRepository.getManyAndCount(this.encryptionMode, {
      ...searchValue,
      patientId,
      patientName,
    });
    const decryptedRusCases = await this.decryptRusCases(rusCases);
    return [decryptedRusCases, rusCasesCount];
  }

  // 여러개 조회하기(리소스 접근권한 필요)
  async getOwnManyAndCount(userId: number, searchValue: GetAllRusCaseServiceReq): Promise<[RusCase[], number]> {
    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      const [rusCases, rusCasesCount] = await this.rusCaseRepository.getOwnManyAndCount(this.encryptionMode, userId, searchValue);
      return [rusCases, rusCasesCount];
    }

    // 암호화 모드:활성화
    const { patientId, patientName } = await this.utilService.encryptPromise({ patientId: searchValue.patientId, patientName: searchValue.patientName });
    const [rusCases, rusCasesCount] = await this.rusCaseRepository.getOwnManyAndCount(this.encryptionMode, userId, {
      ...searchValue,
      patientId,
      patientName,
    });
    const decryptedRusCases = await this.decryptRusCases(rusCases);
    return [decryptedRusCases, rusCasesCount];
  }

  async getManyAndCountWithHu3d(): Promise<[RusCase[], number]> {
    const [rusCases, count] = await this.rusCaseRepository.getManyWithHu3d();
    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      return [rusCases, count];
    }
    // 암호화 모드:활성화
    const decryptedRusCases = await this.decryptRusCases(rusCases);
    return [decryptedRusCases, count];
  }

  async getOwnManyAndCountWithHu3d(userId: number): Promise<[RusCase[], number]> {
    const [rusCases, count] = await this.rusCaseRepository.getOwnManyWithHu3d(userId);
    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      return [rusCases, count];
    }
    // 암호화 모드:활성화
    const decryptedRusCases = await this.decryptRusCases(rusCases);
    return [decryptedRusCases, count];
  }

  // 하나 조회하기(id 기준)
  async getOneById(id: number): Promise<RusCase | null> {
    const rusCase = await this.rusCaseRepository.getOneById(id);
    if (!rusCase) {
      return null;
    }
    // 암호화 모드:비활성화
    if (!this.encryptionMode) {
      return rusCase;
    }
    // 암호화 모드:활성화
    const decryptedRusCases = await this.decryptRusCases([rusCase]);
    return decryptedRusCases[0];
  }

  // 하나 조회하기(studyId 기준)
  async getOneByStudyId(studyId: number): Promise<RusCase | null> {
    const rusCase = await this.rusCaseRepository.getOneByStudyId(studyId);
    if (!rusCase) {
      return null;
    }
    const decryptedRusCases = await this.decryptRusCases([rusCase]);
    return decryptedRusCases[0];
  }

  /**
   * 하나 수정하기(huId 기준)
   * @param huId string 수정 기준 칼럼
   * @param values {status?: RusCaseStatus, operationDate?: string, deliveryDate?: string} 변경값
   * @param requestorId number 요청자 DB id
   * @returns PatchRusCaseServiceReq {id: number} rusCase.id
   */
  async updateOneByHuId(huId: string, values: PatchRusCaseServiceReq, requestorId?: number): Promise<PatchRusCaseServiceRes> {
    const rusCase = await this.rusCaseRepository.getOneByHuId(huId);
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID.statusCode);
    }

    // 작업 상태가 이미 완료된 케이스는 status 수정 불가(status: DONE|REJECT)
    if (values.status && [RusCaseStatus.DONE, RusCaseStatus.REJECT].includes(<RusCaseStatus>rusCase.status)) {
      throw new HttpException(HutomHttpException.INVALID_RUS_CASE_STATUS_UPDATE, HutomHttpException.INVALID_RUS_CASE_STATUS_UPDATE.statusCode);
    }

    const { status, operationDate, deliveryDate } = values;
    if (status === RusCaseStatus.REJECT && !!requestorId) {
      await this.cancelOne({ id: rusCase.id, isUserRequest: true, requestorId });
    } else if (status === RusCaseStatus.REJECT && !requestorId) {
      await this.cancelOne({ id: rusCase.id, isUserRequest: false });
    } else if (status) {
      await this.rusCaseRepository.updateOneById(rusCase.id, { status });
    }

    if (operationDate || deliveryDate) {
      await this.clinicalInfoRepository.updateOneByRusCaseId(rusCase.id, {
        operationDate: operationDate ?? rusCase.clinicalInfo.operationDate?.toISOString(),
        deliveryDate: deliveryDate ?? rusCase.clinicalInfo.deliveryDate.toISOString(),
      });
    }

    return new PatchRusCaseServiceRes(rusCase.id);
  }

  // hu3d filePath 가져오기(id 기준)
  async getHu3dById(id: number): Promise<Hu3d> {
    return (await this.rusCaseRepository.findHu3dFilePathById(id))?.hu3d;
  }

  // hu3d 파일 업로드
  async updateHu3dById(id: number, file: Express.Multer.File, requestorId: number): Promise<{ id: number }> {
    const rusCase = await this.rusCaseRepository.getOneById(id);
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.statusCode);
    }
    if (!file.originalname.startsWith(rusCase.study.huId)) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_FILE_NAME, HutomHttpException.INVALID_REQUEST_FILE_NAME.statusCode);
    }
    const tempFilePath = file.path;
    const filePath = path.join(file.destination, file.originalname);
    const fileName = file.originalname;
    const fileSize = file.size;
    if (!rusCase.hu3d) {
      await this.hu3dService.createOne({ rusCaseWithStudy: rusCase, tempFilePath, filePath, fileName, fileSize, requestorId });
    } else {
      await this.hu3dService.updateFile(rusCase.hu3d.id, {
        rusCaseWithStudy: rusCase,
        version: rusCase.hu3d.version + 1,
        tempFilePath,
        filePath,
        fileName,
        fileSize,
        requestorId,
      });
      const prevFilePath = rusCase.hu3d?.filePath;
      if (rusCase.hu3d?.filePath !== filePath) {
        try {
          await fs.promises.rm(prevFilePath);
          this.logger.log(`I: Succeeded in removing previous file(path:${prevFilePath})`);
        } catch (error) {
          this.logger.log(`E: Failed to remove previous file(path:${prevFilePath})`);
        }
      }
    }

    return { id: rusCase.id };
  }

  // hu3d 파일 업로드
  async updateHu3dByHuId(huId: string, file: Express.Multer.File): Promise<{ id: number }> {
    const rusCase = await this.rusCaseRepository.getOneByHuId(huId);
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID.statusCode);
    }
    if (!file.originalname.startsWith(rusCase.study.huId)) {
      throw new HttpException(HutomHttpException.INVALID_REQUEST_FILE_NAME, HutomHttpException.INVALID_REQUEST_FILE_NAME.statusCode);
    }
    const tempFilePath = file.path;
    const filePath = path.join(file.destination, file.originalname);
    const fileName = file.originalname;
    const fileSize = file.size;
    if (!rusCase.hu3d) {
      await this.hu3dService.createOne({ rusCaseWithStudy: rusCase, tempFilePath, filePath, fileName, fileSize });
    } else {
      await this.hu3dService.updateFile(rusCase.hu3d.id, {
        rusCaseWithStudy: rusCase,
        version: rusCase.hu3d.version + 1,
        tempFilePath,
        filePath,
        fileName,
        fileSize,
      });
      const prevFilePath = rusCase.hu3d?.filePath;
      if (prevFilePath !== filePath) {
        try {
          await fs.promises.rm(prevFilePath);
          this.logger.log(`I: Succeeded in removing previous file(path:${prevFilePath})`);
        } catch (error) {
          this.logger.log(`E: Failed to remove previous file(path:${prevFilePath})`);
        }
      }
    }

    return { id: rusCase.id };
  }

  /**
   * 작업 취소하기
   * * 유효성 검사
   * 1. rusCase.status=TODO 검사
   * 2. 작업이 이미 완료된 경우: 처리 불가
   *
   * * flow
   * 1. status을 reject 로 변경
   * 2. 크레딧 환불: 크레딧 이력 생성
   * 3. h-Space 상태 변경 요청
   * 4. 다이콤 파일이 존재하는 경우: 1)파일 삭제 2) 파일 삭제 알림을 케이스 생성자에게 생성(본인이 처리한 경우 알림 미생성)
   *
   * @param rusCaseId number
   * @param isUserRequest boolean
   * @param requestorId number
   * @returns number rusCase.id
   */
  async cancelOne(dto: { id: number; isUserRequest: boolean; requestorId?: number }): Promise<number> {
    const { id, isUserRequest, requestorId } = dto;
    const rusCase = await this.rusCaseRepository.getOneById(id);

    // 유효하지 않은 id인 경우
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.statusCode);
    }

    // user 요청인 경우, 작업 상태가 TODO인 케이스만 처리 가능
    if (isUserRequest && rusCase.status !== RusCaseStatus.TODO) {
      throw new HttpException(HutomHttpException.INVALID_RUS_CASE_REJECT_REQUEST_STATUS, HutomHttpException.INVALID_RUS_CASE_REJECT_REQUEST_STATUS.statusCode);
    }

    // 작업 상태가 이미 완료된 케이스는 처리 불가(status: DONE|REJECT)
    if ([RusCaseStatus.DONE, RusCaseStatus.REJECT].includes(<RusCaseStatus>rusCase.status)) {
      throw new HttpException(HutomHttpException.INVALID_RUS_CASE_REJECT_REQUEST_STATUS, HutomHttpException.INVALID_RUS_CASE_REJECT_REQUEST_STATUS.statusCode);
    }

    // 케이스 소유자가 삭제된 경우
    if (!rusCase.userId) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }

    const user = await this.userRepository.findById(rusCase.userId);

    const queryRunner = this.connection.createQueryRunner();

    const rusCaseRepository = queryRunner.manager.getCustomRepository(RusCaseRepository);
    const notificationRepository = queryRunner.manager.getCustomRepository(NotificationRepository);
    const creditHistoryRepository = queryRunner.manager.getCustomRepository(CreditHistoryRepository);

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const updatedRusCase = await rusCaseRepository.updateOneById(rusCase.id, { status: RusCaseStatus.REJECT });

      // h-Server 크레딧 환불
      if (isUserRequest) {
        await this.creditHistoryService.createRusCancelByUser({ userId: requestorId, huId: rusCase.study.huId }, creditHistoryRepository);
      } else {
        await this.creditHistoryService.createRusCancelByServer(rusCase.study.huId, creditHistoryRepository);
      }

      // notification 생성: 대표계정
      const admin = await this.userRepository.getAdmin();
      if (admin) {
        await notificationRepository.createOne({
          category: Category.RUS_CANCELED,
          userId: admin.id,
        });
      }
      // notification 생성: 일반계정(rusCase 생성 계정)
      if (rusCase.userId && rusCase.userId !== admin?.id) {
        await notificationRepository.createOne({
          category: Category.RUS_CANCELED,
          userId: rusCase.userId,
        });
      }

      // h-Space 크레딧 환불(h-Space 전송)
      if (isUserRequest) {
        await this.cloudService.postRusCasesReject({ huId: rusCase.study.huId, email: user.email });
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // 다이콤 파일이 저장된 경우, 파일 제거
      if (rusCase.study.dicom.filePath) {
        await this.dicomService.deleteFileById(rusCase.study.dicom.id, {
          userId: rusCase.userId,
          huId: rusCase.study.huId,
        });
      }

      return updatedRusCase.id;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }
}
