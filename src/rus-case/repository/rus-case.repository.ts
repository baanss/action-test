import { EntityRepository, Repository, SelectQueryBuilder } from "typeorm";
import { HttpException } from "@nestjs/common";

import { RusCase } from "@src/common/entity/rus-case.entity";
import { OrderQuery, RusCaseSortQuery } from "@src/common/constant/enum.constant";
import { GetAllRusCaseRepositoryReq, PatchRusCaseRepositoryReq } from "@src/rus-case/dto";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@EntityRepository(RusCase)
export class RusCaseRepository extends Repository<RusCase> {
  async createOne(dto: { studyId: number; userId: number; surgeonId?: number }): Promise<number> {
    return this.insert(dto).then((insertResult) => insertResult.identifiers[0]?.id);
  }

  /**
   * 여러개 조회하기
   * @param encryptionMode boolean DB 암호화 설정 여부
   * @param dto GetAllRusCaseRepositoryReq
   * @param query SelectQueryBuilder<RusCase>
   * @returns [RusCase[], number]
   */
  async getManyAndCount(encryptionMode: boolean, dto: GetAllRusCaseRepositoryReq, sqb?: SelectQueryBuilder<RusCase>): Promise<[RusCase[], number]> {
    const { patientId, patientName, huId, userName, startDeliveryDate, endDeliveryDate, page, limit, sort, order } = dto;

    const query = sqb ? sqb : this.createQueryBuilder("rusCase").select("rusCase");

    // join
    query.innerJoinAndSelect("rusCase.clinicalInfo", "clinicalInfo");
    query.innerJoin("rusCase.study", "study").addSelect("study.huId").addSelect("study.patientId").addSelect("study.patientName");
    query.leftJoin("rusCase.user", "user").addSelect("user.name");
    query.leftJoin("rusCase.hu3d", "hu3d").addSelect("hu3d");
    query.leftJoin("rusCase.feedback", "feedback").addSelect("feedback.id");
    query.leftJoin("rusCase.surgeon", "surgeon").addSelect("surgeon.name");

    // 검색
    if (encryptionMode && patientId) {
      query.andWhere("study.patientId = :patientId", { patientId });
    }
    if (!encryptionMode && patientId) {
      query.andWhere("study.patientId ILIKE :patientId", { patientId: `%${patientId}%` });
    }
    if (encryptionMode && patientName) {
      query.andWhere("study.patientName = :patientName", { patientName });
    }
    if (!encryptionMode && patientName) {
      query.andWhere("study.patientName ILIKE :patientName", { patientName: `%${patientName}%` });
    }
    if (huId) {
      query.andWhere("study.huId ILIKE :huId", { huId: `%${huId}%` });
    }
    if (startDeliveryDate && endDeliveryDate) {
      query.andWhere(
        "clinicalInfo.deliveryDate >= :startDeliveryDate::TIMESTAMPTZ AND clinicalInfo.deliveryDate < :endDeliveryDate::TIMESTAMPTZ + INTERVAL '1 DAY'",
        {
          startDeliveryDate,
          endDeliveryDate,
        },
      );
    }
    if (userName) {
      query.andWhere("user.name ILIKE :userName", { userName: `%${userName}%` });
    }

    // 정렬
    switch (sort + order) {
      case RusCaseSortQuery.DELIVERY_DATE + OrderQuery.ASC:
        query.orderBy("clinicalInfo.deliveryDate", "ASC").addOrderBy("study.createdAt", "DESC");
        break;
      case RusCaseSortQuery.DELIVERY_DATE + OrderQuery.DESC:
        query.orderBy("clinicalInfo.deliveryDate", "DESC").addOrderBy("study.createdAt", "DESC");
        break;
      case RusCaseSortQuery.CREATED_AT + OrderQuery.ASC:
        query.orderBy("study.createdAt", "ASC");
        break;
      case RusCaseSortQuery.CREATED_AT + OrderQuery.DESC:
        query.orderBy("study.createdAt", "DESC");
        break;
      default:
        query.orderBy("study.createdAt", "DESC");
        break;
    }

    // 페이지네이션
    if (limit !== -1) {
      query.offset((page - 1) * limit).limit(limit);
    }

    return query.getManyAndCount();
  }

  /**
   * 여러개 조회하기(본인 생성)
   * @param encryptionMode boolean DB 암호화 설정 여부
   * @param userId number
   * @param dto GetAllRusCaseRepositoryReq
   * @returns [RusCase[], number]
   */
  getOwnManyAndCount(encryptionMode: boolean, userId: number, dto: GetAllRusCaseRepositoryReq): Promise<[RusCase[], number]> {
    const query = this.createQueryBuilder("rusCase").select("rusCase").where("rusCase.user_id = :userId", { userId });

    // 본인 데이터 조회
    query.andWhere("rusCase.userId = :userId", { userId });

    return this.getManyAndCount(encryptionMode, dto, query);
  }

  // 케이스 리스트 조회(RUS Client)
  async getManyWithHu3d(sqb?: SelectQueryBuilder<RusCase>): Promise<[RusCase[], number]> {
    const query = sqb ? sqb : this.createQueryBuilder("rusCase").select("rusCase");

    // study join
    this.joinStudy(query);

    // clinicalInfo join
    this.joinClinicalInfo(query);

    // hu3d join
    this.joinHu3d(query);

    // 파일을 가지는 케이스 필터링
    query.andWhere("hu3d.filePath IS NOT NULL");

    return query.orderBy("study.huId", "ASC").getManyAndCount();
  }

  // 케이스 리스트 조회(RUS Client)
  async getOwnManyWithHu3d(userId: number): Promise<[RusCase[], number]> {
    const query = this.createQueryBuilder("rusCase").select("rusCase");

    // 본인 데이터 조회
    query.where("rusCase.userId = :userId", { userId });

    return this.getManyWithHu3d(query);
  }

  // 하나 가져오기(id 기준)
  getOneById(id: number): Promise<RusCase> {
    const query = this.createQueryBuilder("rusCase").where("rusCase.id = :id", { id });

    // clinicalInfo 테이블 조인
    this.joinClinicalInfo(query);

    // Study 테이블 조인
    this.joinStudy(query);

    // Dicom 테이블 조인
    this.joinDicom(query);

    // Hu3d join(left join)
    this.leftJoinHu3d(query);

    // Feedback join(left join)
    this.leftjoinFeedback(query);

    // Surgeon join(left join)
    this.leftjoinSurgeon(query).addSelect("surgeon");

    // User Join(left join)
    this.leftJoinUser(query).addSelect("user");

    return query.getOne();
  }

  // 하나 가져오기(huId 기준)
  getOneByHuId(huId: string): Promise<RusCase> {
    const query = this.createQueryBuilder("rusCase").select("rusCase");

    // Study 테이블 조인
    this.joinStudy(query);
    query.where("study.huId = :huId", { huId });

    // clinicalInfo 테이블 조인
    this.joinClinicalInfo(query);

    // Hu3d join(left join)
    this.leftJoinHu3d(query);

    // Dicom 테이블 조인
    this.joinDicom(query);

    // Feedback 테이블 조인
    this.leftjoinFeedback(query);

    // User Join(left join)
    this.leftJoinUser(query).addSelect("user");

    return query.getOne();
  }

  // 하나 가져오기(studyId 기준)
  getOneByStudyId(studyId: number): Promise<RusCase> {
    const query = this.createQueryBuilder("rusCase").select("rusCase");

    // Study 테이블 조인
    this.joinStudy(query);
    query.where("study.id = :studyId", { studyId });

    return query.getOne();
  }

  // 하나 수정하기(id 기준)
  async updateOneById(id: number, values: PatchRusCaseRepositoryReq): Promise<RusCase> {
    // 업데이트
    const updateResult = await this.createQueryBuilder().update().set(values).where("id = :id", { id }).returning(["id"]).execute();
    if (!updateResult?.affected) {
      throw new HttpException(HutomHttpException.UPDATE_DATA_ERROR, HutomHttpException.UPDATE_DATA_ERROR.statusCode);
    }
    return updateResult.raw[0];
  }

  getOne(condition: Partial<RusCase>): Promise<RusCase> {
    return this.findOne(condition);
  }

  // userId 조회하기(id 기준)
  findUserIdById(id: number) {
    const query = this.createQueryBuilder("rusCase").select("rusCase.userId").where("rusCase.id = :id", { id });
    this.leftJoinHu3d(query);

    return query.getOne();
  }

  // hu3d filePath 조회하기(id 기준)
  findHu3dFilePathById(id: number) {
    const query = this.createQueryBuilder("rusCase").where("rusCase.id = :id", {
      id,
    });
    // hu3d join
    this.joinHu3d(query);
    return query.addSelect("hu3d.filePath").getOne();
  }

  // ClinicalInfo 테이블 조인
  private joinClinicalInfo(query: SelectQueryBuilder<RusCase>) {
    return query.innerJoinAndSelect("rusCase.clinicalInfo", "clinicalInfo", "rusCase.id = clinicalInfo.rusCaseId");
  }

  // Study 테이블 조인
  private joinStudy(query: SelectQueryBuilder<RusCase>) {
    return query
      .innerJoin("rusCase.study", "study", "rusCase.study_id = study.id")
      .addSelect("study.id")
      .addSelect("study.huId")
      .addSelect("study.patientId")
      .addSelect("study.patientName");
  }

  // Dicom 테이블 조인
  private joinDicom(query: SelectQueryBuilder<RusCase>) {
    return query
      .innerJoin("study.dicom", "dicom", "study.id = dicom.study_id")
      .addSelect("dicom.id")
      .addSelect("dicom.filePath")
      .addSelect("dicom.fileName")
      .addSelect("dicom.fileSize");
  }

  // Hu3d 테이블 조인
  private joinHu3d(query: SelectQueryBuilder<RusCase>) {
    return query
      .innerJoin("rusCase.hu3d", "hu3d", "rusCase.id = hu3d.rus_case_id")
      .addSelect("hu3d.id")
      .addSelect("hu3d.filePath")
      .addSelect("hu3d.fileName")
      .addSelect("hu3d.fileSize")
      .addSelect("hu3d.version");
  }

  // User 테이블 조인
  private leftJoinUser(query: SelectQueryBuilder<RusCase>) {
    return query.leftJoin("rusCase.user", "user", "rusCase.user_id = user.id");
  }

  // Hu3d 테이블 조인(left join)
  private leftJoinHu3d(query: SelectQueryBuilder<RusCase>) {
    return query
      .leftJoin("rusCase.hu3d", "hu3d", "rusCase.id = hu3d.rus_case_id")
      .addSelect("hu3d.id")
      .addSelect("hu3d.filePath")
      .addSelect("hu3d.fileName")
      .addSelect("hu3d.fileSize")
      .addSelect("hu3d.version");
  }

  // feedback 테이블 조인(left join)
  private leftjoinFeedback(qeury: SelectQueryBuilder<RusCase>) {
    return qeury.leftJoin("rusCase.feedback", "feedback", "rusCase.id = feedback.rus_case_id").addSelect("feedback.id");
  }

  // Surgeon 테이블 조인(left join)
  private leftjoinSurgeon(qeury: SelectQueryBuilder<RusCase>) {
    return qeury.leftJoin("rusCase.surgeon", "surgeon", "rusCase.surgeonId = surgeon.id");
  }
}
