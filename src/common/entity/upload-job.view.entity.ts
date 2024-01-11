import { Connection, ViewColumn, ViewEntity } from "typeorm";
import { UploadJob } from "@src/common/entity/upload-job.entity";
import { Study } from "@src/common/entity/study.entity";
import { User } from "@src/common/entity/user.entity";
import { Dicom } from "@src/common/entity/dicom.entity";

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .addSelect("upload_job.id", "upload_job_id")
      .addSelect("upload_job.hu_id", "upload_job_hu_id")
      .addSelect("upload_job.ae_mode", "upload_job_ae_mode")
      .addSelect("upload_job.status", "upload_job_status")
      .addSelect("upload_job.patient_id", "upload_job_patient_id")
      .addSelect("upload_job.patient_name", "upload_job_patient_name")
      .addSelect("upload_job.age", "upload_job_age")
      .addSelect("upload_job.sex", "upload_job_sex")
      .addSelect("upload_job.updated_at", "upload_job_updated_at")
      .addSelect("upload_job.created_at", "upload_job_created_at")
      .from(UploadJob, "upload_job")
      .leftJoin(Study, "study", "upload_job.id = study.upload_job_id")
      .addSelect("study.id", "study_id")
      .addSelect("study.patient_id", "study_patient_id")
      .addSelect("study.patient_name", "study_patient_name")
      .addSelect("study.study_date", "study_study_date")
      .addSelect("study.study_description", "study_study_description")
      .addSelect("study.series_count", "study_series_count")
      .addSelect("study.instances_count", "study_instances_count")
      .addSelect("study.age", "study_age")
      .addSelect("study.sex", "study_sex")
      .addSelect("study.is_registerd", "study_is_registerd")
      .leftJoin(User, "user", "upload_job.user_id = user.id")
      .addSelect("user.id", "user_id")
      .addSelect("user.name", "user_name")
      .leftJoin(Dicom, "dicom", "study.id = dicom.study_id")
      .addSelect("dicom.id", "dicom_id")
      .addSelect("dicom.file_path", "dicom_file_path"),
})
// FIXME: 엔티티 칼럼 필요에 따라 추가
export class UploadJobView {
  @ViewColumn({ name: "upload_job_id" })
  id: number;

  @ViewColumn({ name: "upload_job_hu_id" })
  huId: string;

  @ViewColumn({ name: "upload_job_ae_mode" })
  aeMode: string | null;

  @ViewColumn({ name: "upload_job_status" })
  status: string;

  @ViewColumn({ name: "upload_job_patient_id" })
  patientId: string | null;

  @ViewColumn({ name: "upload_job_patient_name" })
  patientName: string | null;

  @ViewColumn({ name: "upload_job_age" })
  age: number | null;

  @ViewColumn({ name: "upload_job_sex" })
  sex: string | null;

  @ViewColumn({ name: "upload_job_created_at" })
  createdAt: Date;

  @ViewColumn({ name: "upload_job_updated_at" })
  updatedAt: Date;

  @ViewColumn({ name: "study_id" })
  studyId: number | null;

  @ViewColumn({ name: "study_patient_id" })
  studyPatientId: string | null;

  @ViewColumn({ name: "study_patient_name" })
  studyPatientName: string | null;

  @ViewColumn({ name: "study_study_date" })
  studyDate: Date;

  @ViewColumn({ name: "study_study_description" })
  studyDescription: string;

  @ViewColumn({ name: "study_series_count" })
  studySeriesCount: number;

  @ViewColumn({ name: "study_instances_count" })
  studyInstancesCount: number;

  @ViewColumn({ name: "study_age" })
  studyAge: number;

  @ViewColumn({ name: "study_sex" })
  studySex: string;

  @ViewColumn({ name: "study_is_registerd" })
  isRegistered: boolean;

  @ViewColumn({ name: "user_id" })
  userId: number | null;

  @ViewColumn({ name: "user_name" })
  userName: string | null;

  @ViewColumn({ name: "dicom_file_path" })
  dicomId: number | null;

  @ViewColumn({ name: "dicom_file_path" })
  dicomFilePath: string | null;
}
