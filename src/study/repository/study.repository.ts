import { Brackets, EntityRepository, Repository, UpdateResult } from "typeorm";
import { Study } from "@src/common/entity/study.entity";
import { HttpException } from "@nestjs/common";
import { OrderQuery, StudySortQuery, StudyStorageSortQuery } from "@src/common/constant/enum.constant";
import { GetAllStudyRepositoryReq, PostStudyRepositoryReq } from "@src/study/dto";
import { GetAllStorageStudyRepositoryReq } from "@src/storage/dto";
import { Sex } from "@src/common/constant/enum.constant";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@EntityRepository(Study)
export class StudyRepository extends Repository<Study> {
  // 하나 생성하기
  createOne(dto: PostStudyRepositoryReq): Promise<{ id: number }> {
    const insertDto = dto;
    if (!Object.values(Sex).includes(dto.sex)) {
      insertDto.sex = null;
    }
    return this.insert(insertDto).then((insertResult) => {
      if (insertResult.identifiers[0]?.id) {
        return { id: insertResult.identifiers[0]?.id };
      }
      throw new HttpException(HutomHttpException.CREATE_DATA_ERROR, HutomHttpException.CREATE_DATA_ERROR.statusCode);
    });
  }

  // 하나 가져오기(huID 기준)
  getOneByHuId(huId: string): Promise<Study> {
    return this.createQueryBuilder("study").where("study.huId = :huId", { huId }).getOne();
  }

  // 모두 가져오기
  getAllAndCount(): Promise<[Study[], number]> {
    const query = this.createQueryBuilder("study").select("study");

    return query.addOrderBy("study.id", "ASC").getManyAndCount();
  }

  // 여러개 가져오기
  getManyAndCount(getAllStudyRepositoryReq: GetAllStudyRepositoryReq): Promise<[Study[], number]> {
    const { patientId, patientName, huId, startStudyDate, endStudyDate, startCreatedAt, endCreatedAt, page, limit, sort, order } = getAllStudyRepositoryReq;
    const query = this.createQueryBuilder("study").select("study");

    // dicom join
    query
      .innerJoin("study.dicom", "dicom", "study.id = dicom.study_id")
      .addSelect("dicom.id")
      .addSelect("dicom.filePath")
      .addSelect("dicom.fileName")
      .addSelect("dicom.fileSize");

    // 문자열 쿼리
    if (patientId) {
      // NOTE: patientId 암호화 처리 - 전체 일치 검색
      query.andWhere("study.patient_id = :patientId", {
        patientId,
      });
    }
    if (patientName) {
      // NOTE: patientName 암호화 처리 - 전체 일치 검색
      query.andWhere("study.patient_name = :patientName", {
        patientName,
      });
    }
    if (huId) {
      query.andWhere("study.hu_id ILIKE :huId", { huId: `%${huId}%` });
    }
    if (startStudyDate && endStudyDate) {
      query.andWhere("study.study_date >= :startStudyDate::TIMESTAMPTZ AND study.study_date < :endStudyDate::TIMESTAMPTZ + INTERVAL '1 DAY'", {
        startStudyDate,
        endStudyDate,
      });
    }
    if (startCreatedAt && endCreatedAt) {
      query.andWhere("study.created_at >= :startCreatedAt::TIMESTAMPTZ AND study.created_at < :endCreatedAt::TIMESTAMPTZ + INTERVAL '1 DAY'", {
        startCreatedAt,
        endCreatedAt,
      });
    }

    // 정렬
    switch (sort + order) {
      case StudySortQuery.CREATED_AT + OrderQuery.ASC:
        query.orderBy("study.createdAt", "ASC");
        break;
      case StudySortQuery.CREATED_AT + OrderQuery.DESC:
        query.orderBy("study.createdAt", "DESC");
        break;
      case StudySortQuery.STUDY_DATE + OrderQuery.ASC:
        query.orderBy("study.studyDate", "ASC");
        break;
      case StudySortQuery.STUDY_DATE + OrderQuery.DESC:
        query.orderBy("study.studyDate", "DESC");
        break;
      default:
        query.orderBy("study.createdAt", "DESC");
        break;
    }

    return query
      .addOrderBy("study.id", "ASC")
      .offset((page - 1) * limit)
      .limit(limit)
      .getManyAndCount();
  }

  // 파일이 존재하는 스터디 조회(userId 기준)
  getManyAndCountWithFile(encryptionMode: boolean, dto: GetAllStorageStudyRepositoryReq): Promise<[Study[], number]> {
    const { patientId, patientName, huId, startDeliveryDate, endDeliveryDate, page, limit, sort, order } = dto;

    const query = this.createQueryBuilder("study").select("study");

    // 문자열 검색
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

    // join
    query
      .innerJoinAndSelect("study.dicom", "dicom", "study.id = dicom.study_id")
      .leftJoinAndSelect("study.rusCase", "rusCase")
      .leftJoinAndSelect("rusCase.clinicalInfo", "clinicalInfo", "rusCase.id = clinicalInfo.rus_case_id")
      .leftJoinAndSelect("rusCase.hu3d", "hu3d", "rusCase.id = hu3d.rus_case_id");

    // 파일 존재
    query.andWhere(new Brackets((qb) => qb.orWhere("dicom.file_size > 0").orWhere("hu3d.file_size > 0")));

    // 날짜 쿼리
    if (startDeliveryDate && endDeliveryDate) {
      query.andWhere(
        "clinicalInfo.deliveryDate >= :startDeliveryDate::TIMESTAMPTZ AND clinicalInfo.deliveryDate < :endDeliveryDate::TIMESTAMPTZ + INTERVAL '1 DAY'",
        {
          startDeliveryDate,
          endDeliveryDate,
        },
      );
    }

    // 정렬
    switch (sort + order) {
      case StudyStorageSortQuery.CREATED_AT + OrderQuery.ASC:
        query.orderBy("study.createdAt", "ASC");
        break;
      case StudyStorageSortQuery.CREATED_AT + OrderQuery.DESC:
        query.orderBy("study.createdAt", "DESC");
        break;
      case StudyStorageSortQuery.DELIVERY_DATE + OrderQuery.ASC:
        query.orderBy("clinicalInfo.deliveryDate", "ASC");
        break;
      case StudyStorageSortQuery.DELIVERY_DATE + OrderQuery.DESC:
        query.orderBy("clinicalInfo.deliveryDate", "DESC");
        break;
      case StudyStorageSortQuery.OPERATION_TYPE + OrderQuery.ASC:
        query.orderBy("clinicalInfo.operationType", "ASC");
        break;
      case StudyStorageSortQuery.OPERATION_TYPE + OrderQuery.DESC:
        query.orderBy("clinicalInfo.operationType", "DESC");
        break;
      default:
        query.orderBy("study.createdAt", "DESC");
        break;
    }
    query.addOrderBy("study.id", "ASC");

    // 페이지네이션
    if (limit !== -1) {
      query.offset((page - 1) * limit).limit(limit);
    }

    return query.getManyAndCount();
  }

  // 하나 가져오기(id 기준)
  getOneById(id: number): Promise<Study> {
    const query = this.createQueryBuilder("study").where(`study.id = ${id}`);
    // dicom join
    query
      .innerJoin("study.dicom", "dicom", "study.id = dicom.study_id")
      .addSelect("dicom.id")
      .addSelect("dicom.filePath")
      .addSelect("dicom.fileName")
      .addSelect("dicom.fileSize");

    return query.getOne();
  }

  /**
   * 하나 수정하기
   * @param id 수정할 Study DB id
   * @param dto patientId, patientName
   * @returns UpdateResult { raw: id }
   */
  updatePatient(id: number, dto: { patientId: string; patientName: string }): Promise<UpdateResult> {
    return this.createQueryBuilder("study").update().set({ patientId: dto.patientId, patientName: dto.patientName }).where({ id }).returning("id").execute();
  }

  updateFile(id: number, dto: { seriesCount: number; instancesCount: number }): Promise<UpdateResult> {
    return this.createQueryBuilder("study")
      .update()
      .set({ seriesCount: dto.seriesCount, instancesCount: dto.instancesCount })
      .where({ id })
      .returning("id")
      .execute();
  }
}
