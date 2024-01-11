import * as moment from "moment";
import { Brackets, EntityRepository, Repository, UpdateResult } from "typeorm";
import { UploadJob } from "@src/common/entity/upload-job.entity";
import {
  CreateUploadJobRepositoryReq,
  GetUploadJobByStudyInstanceUIDRepositoryReq,
  GetUploadJobRepositoryReq,
  PatchUploadJobRepositoryReq,
} from "@src/upload-job/dto";
import { HttpException, Logger } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { AeMode, OrderQuery, Sex, UploadJobStatus } from "@src/common/constant/enum.constant";

@EntityRepository(UploadJob)
export class UploadJobRepository extends Repository<UploadJob> {
  private readonly logger = new Logger(UploadJobRepository.name);

  // 하나 생성하기
  async createOne(dto: CreateUploadJobRepositoryReq): Promise<{ id: number }> {
    const { age, sex, patientId, patientName, huId, aeMode, studyInstanceUID, isAquired, userId, instancesCount } = dto;
    const parsedSex = Object.values(Sex).includes(sex) ? sex : null;
    const parsedAeMode = Object.values(AeMode).includes(aeMode as AeMode) ? aeMode : null;
    return this.insert({
      sex: parsedSex,
      aeMode: parsedAeMode,
      age,
      patientId,
      patientName,
      huId,
      studyInstanceUID,
      isAquired,
      userId,
      instancesCount,
    }).then((insertResult) => insertResult.raw[0]);
  }

  // 하나 조회하기
  async getOneByServerCode(dto: GetUploadJobRepositoryReq): Promise<UploadJob> {
    const { serverCode, order = null } = dto;
    const query = this.createQueryBuilder("uploadJob")
      .select("uploadJob")
      .andWhere("uploadJob.huId ILIKE :serverCode", { serverCode: `${serverCode}%` });

    switch (order) {
      case OrderQuery.ASC:
        query.orderBy("uploadJob.huId", "ASC");
        break;
      case OrderQuery.DESC:
        query.orderBy("uploadJob.huId", "DESC");
        break;
    }

    return query.getOne();
  }

  // 하나 조회하기(id)
  async findById(id: number): Promise<UploadJob> {
    return this.createQueryBuilder().select().where({ id }).getOne();
  }

  /**
   * 하나 수정하기
   * @param id number
   * @param patchUploadJobRepositoryReq PatchUploadJobRepositoryReq {studyId, status, message, isAquired}
   * @returns UpdateResult
   */
  async updateOneById(id: number, patchUploadJobRepositoryReq: PatchUploadJobRepositoryReq): Promise<UpdateResult> {
    return await this.createQueryBuilder().update().set(patchUploadJobRepositoryReq).where("id = :id", { id }).returning("id").execute();
  }

  /**
   * 여러개 조회하기
   * @param dto GetUploadJobByStudyInstanceUIDRepositoryReq
   * @returns
   */
  async findMany(dto: GetUploadJobByStudyInstanceUIDRepositoryReq): Promise<UploadJob[]> {
    const { studyInstanceUID, status = null } = dto;

    const query = this.createQueryBuilder("uploadJob").select("uploadJob");

    // 조건 기준으로 쿼리
    if (studyInstanceUID) {
      query.andWhere("uploadJob.studyInstanceUID = :studyInstanceUID", { studyInstanceUID });
    }
    if (status) {
      query.andWhere("uploadJob.status = :status", { status });
    }

    return await query
      .orderBy("uploadJob.createdAt", "ASC")
      .getMany()
      .catch((e) => {
        this.logger.error(`upload-job 조회 실패, dto: ${JSON.stringify(dto)}, e: ${e}`);
        throw new HttpException(HutomHttpException.INTERNAL_SERVER_ERROR, HutomHttpException.INTERNAL_SERVER_ERROR.statusCode);
      });
  }

  // 모두 가져오기
  getAllAndCount(): Promise<[UploadJob[], number]> {
    const query = this.createQueryBuilder("uploadJob").select("uploadJob");

    return query.addOrderBy("uploadJob.id", "ASC").getManyAndCount();
  }

  /**
   * 하나 수정하기
   * @param id 수정할 UploadJob의 DB id
   * @param dto patientId, patientName
   * @returns UpdateResult { raw: id }
   */
  updatePatient(id: number, dto: { patientId: string; patientName: string }): Promise<UpdateResult> {
    return this.createQueryBuilder("uploadJob")
      .update()
      .set({ patientId: dto.patientId, patientName: dto.patientName })
      .where({ id })
      .returning("id")
      .execute();
  }

  /**
   * QR 요청 항목 조회
   */
  async getQrJobsAndCount(dto: { isDone: boolean; timeoutMs: number }): Promise<[UploadJob[], number]> {
    const { isDone, timeoutMs } = dto;

    const query = this.createQueryBuilder("uploadJob").select("uploadJob");
    query.where("uploadJob.aeMode = :aeMode", { aeMode: AeMode.SCU });
    if (isDone) {
      query.andWhere(
        new Brackets(
          (qb) =>
            qb
              .orWhere("uploadJob.studyId IS NOT NULL") // DONE
              .orWhere("uploadJob.status = :status", { status: UploadJobStatus.REJECT }) // REJECT
              .orWhere("uploadJob.createdAt < :createdAt::TIMESTAMPTZ", { createdAt: moment().subtract(timeoutMs, "ms").toISOString() }), // REJECT
        ),
      );
    } else {
      query
        .andWhere("uploadJob.studyId IS NULL")
        .andWhere("uploadJob.status != :status", { status: UploadJobStatus.REJECT })
        .andWhere("uploadJob.createdAt >= :createdAt::TIMESTAMPTZ", { createdAt: moment().subtract(timeoutMs, "ms").toISOString() });
    }
    return query.getManyAndCount();
  }
}
