import { Brackets, EntityRepository, Repository, SelectQueryBuilder } from "typeorm";
import { AeMode, OrderQuery, UploadJobSortQuery } from "@src/common/constant/enum.constant";
import { UploadJobView } from "@src/common/entity/upload-job.view.entity";
import { GetAllUploadJobViewRepositoryReq } from "@src/upload-job/dto/in/get-all-upload-job.view.repository-request.dto";

@EntityRepository(UploadJobView)
export class UploadJobViewRepository extends Repository<UploadJobView> {
  /**
   * 여러개 조회하기(접근 권한 필요)
   * * 접근 권한: 본인 생성했거나, 생성자가 없는 경우
   * @param userId number
   * @param dto GetAllUploadJobViewRepositoryReq
   * @returns [UploadJobView[], number]
   */
  async getOwnManyAndCount(encryptionMode: boolean, userId: number, dto: GetAllUploadJobViewRepositoryReq): Promise<[UploadJobView[], number]> {
    const query = this.createQueryBuilder("upload_job_view").select("upload_job_view");

    // 본인 데이터 조회
    query.andWhere(
      new Brackets((qb) =>
        qb
          .orWhere("upload_job_view.userId = :userId", { userId })
          .orWhere("upload_job_view.userId IS NULL")
          .orWhere("upload_job_view.aeMode = :aeMode", { aeMode: AeMode.SCP }),
      ),
    );

    return this.getManyAndCount(encryptionMode, dto, query);
  }

  /**
   * 여러개 조회하기(접근 권한 불필요)
   * * 접근 권한: 본인 생성했거나, 생성자가 없는 경우
   * @param dto GetAllUploadJobViewRepositoryReq
   * @returns [UploadJobView[], number]
   */
  async getManyAndCount(
    encryptionMode: boolean,
    dto: GetAllUploadJobViewRepositoryReq,
    query?: SelectQueryBuilder<UploadJobView>,
  ): Promise<[UploadJobView[], number]> {
    const { patientId, patientName, userName, startStudyDate, endStudyDate, startCreatedAt, endCreatedAt, page, limit, sort, order, isDicomFileNotDeleted } =
      dto;

    let sqb = query;
    if (!query) {
      sqb = this.createQueryBuilder("upload_job_view").select("upload_job_view");
    }

    // 검색
    if (encryptionMode && patientId) {
      sqb.andWhere(
        new Brackets((qb) =>
          qb
            .orWhere("upload_job_view.study_patient_id = :patientId", { patientId })
            .orWhere("upload_job_view.upload_job_patient_id = :patientId", { patientId }),
        ),
      );
    }

    if (!encryptionMode && patientId) {
      sqb.andWhere(
        new Brackets((qb) =>
          qb
            .orWhere("upload_job_view.study_patient_id ILIKE :patientId", { patientId: `%${patientId}%` })
            .orWhere("upload_job_view.upload_job_patient_id ILIKE :patientId", { patientId: `%${patientId}%` }),
        ),
      );
    }

    if (encryptionMode && patientName) {
      sqb.andWhere(
        new Brackets((qb) =>
          qb
            .orWhere("upload_job_view.study_patient_name = :patientName", { patientName })
            .orWhere("upload_job_view.upload_job_patient_name = :patientName", { patientName }),
        ),
      );
    }

    if (!encryptionMode && patientName) {
      sqb.andWhere(
        new Brackets((qb) =>
          qb
            .orWhere("upload_job_view.study_patient_name ILIKE :patientName", { patientName: `%${patientName}%` })
            .orWhere("upload_job_view.upload_job_patient_name ILIKE :patientName", { patientName: `%${patientName}%` }),
        ),
      );
    }

    if (userName) {
      sqb.andWhere("upload_job_view.user_name ILIKE :userName", { userName: `%${userName}%` });
    }

    if (startStudyDate && endStudyDate) {
      sqb.andWhere(
        "upload_job_view.study_study_date >= :startStudyDate::TIMESTAMPTZ AND upload_job_view.study_study_date < :endStudyDate::TIMESTAMPTZ + INTERVAL '1 DAY'",
        {
          startStudyDate,
          endStudyDate,
        },
      );
    }

    if (startCreatedAt && endCreatedAt) {
      sqb.andWhere(
        "upload_job_view.upload_job_created_at >= :startCreatedAt::TIMESTAMPTZ AND upload_job_view.upload_job_created_at < :endCreatedAt::TIMESTAMPTZ + INTERVAL '1 DAY'",
        {
          startCreatedAt,
          endCreatedAt,
        },
      );
    }

    if (!!isDicomFileNotDeleted) {
      sqb.andWhere(
        new Brackets((qb) =>
          qb
            .orWhere("upload_job_view.study_id IS NULL")
            .orWhere("upload_job_view.study_id IS NOT NULL AND upload_job_view.dicom_id IS NULL")
            .orWhere("upload_job_view.study_id IS NOT NULL AND upload_job_view.dicom_id IS NOT NULL AND upload_job_view.dicom_file_path IS NOT NULL"),
        ),
      );
    }

    // 정렬
    switch (sort + order) {
      case UploadJobSortQuery.CREATED_AT + OrderQuery.ASC:
        sqb.orderBy("upload_job_view.upload_job_created_at", "ASC");
        break;
      case UploadJobSortQuery.CREATED_AT + OrderQuery.DESC:
        sqb.orderBy("upload_job_view.upload_job_created_at", "DESC");
        break;
      case UploadJobSortQuery.STUDY_DATE + OrderQuery.ASC:
        sqb.orderBy("upload_job_view.study_study_date", "ASC");
        break;
      case UploadJobSortQuery.STUDY_DATE + OrderQuery.DESC:
        sqb.orderBy("upload_job_view.study_study_date", "DESC");
        break;
      default:
        sqb.orderBy("upload_job_view.upload_job_created_at", "DESC");
        break;
    }
    sqb.addOrderBy("upload_job_view.id", "ASC");

    // 페이지네이션
    if (limit !== -1) {
      sqb.offset((page - 1) * limit).limit(limit);
    }

    return sqb.getManyAndCount();
  }
}
