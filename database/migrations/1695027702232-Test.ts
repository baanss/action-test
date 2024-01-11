import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-18
 *
 * Create uploadJobView(table: uploadJob, study, user, dicom)
 * Add typeorm_metadata(uploadJobView)
 */
export class Test1695027702232 implements MigrationInterface {
  name = "Test1695027702232";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "upload_job_view" AS SELECT "upload_job"."id" AS "upload_job_id", "upload_job"."status" AS "upload_job_status", "upload_job"."age" AS "upload_job_age", "upload_job"."sex" AS "upload_job_sex", "study"."id" AS "study_id", "study"."age" AS "study_age", "study"."sex" AS "study_sex", "user"."id" AS "user_id", "user"."name" AS "user_name", "upload_job"."hu_id" AS "upload_job_hu_id", "upload_job"."ae_mode" AS "upload_job_ae_mode", "upload_job"."patient_id" AS "upload_job_patient_id", "upload_job"."patient_name" AS "upload_job_patient_name", "upload_job"."updated_at" AS "upload_job_updated_at", "upload_job"."created_at" AS "upload_job_created_at", "study"."patient_id" AS "study_patient_id", "study"."patient_name" AS "study_patient_name", "study"."study_date" AS "study_study_date", "study"."study_description" AS "study_study_description", "study"."series_count" AS "study_series_count", "study"."instances_count" AS "study_instances_count", "study"."is_registerd" AS "study_is_registerd", "dicom"."id" AS "dicom_id", "dicom"."file_path" AS "dicom_file_path" FROM "upload_job" "upload_job" LEFT JOIN "study" "study" ON "upload_job"."id" = "study"."upload_job_id"  LEFT JOIN "user" "user" ON  "upload_job"."user_id" = "user"."id" AND "user"."deleted_at" IS NULL  LEFT JOIN "dicom" "dicom" ON "study"."id" = "dicom"."study_id"`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "upload_job_view",
        'SELECT "upload_job"."id" AS "upload_job_id", "upload_job"."status" AS "upload_job_status", "upload_job"."age" AS "upload_job_age", "upload_job"."sex" AS "upload_job_sex", "study"."id" AS "study_id", "study"."age" AS "study_age", "study"."sex" AS "study_sex", "user"."id" AS "user_id", "user"."name" AS "user_name", "upload_job"."hu_id" AS "upload_job_hu_id", "upload_job"."ae_mode" AS "upload_job_ae_mode", "upload_job"."patient_id" AS "upload_job_patient_id", "upload_job"."patient_name" AS "upload_job_patient_name", "upload_job"."updated_at" AS "upload_job_updated_at", "upload_job"."created_at" AS "upload_job_created_at", "study"."patient_id" AS "study_patient_id", "study"."patient_name" AS "study_patient_name", "study"."study_date" AS "study_study_date", "study"."study_description" AS "study_study_description", "study"."series_count" AS "study_series_count", "study"."instances_count" AS "study_instances_count", "study"."is_registerd" AS "study_is_registerd", "dicom"."id" AS "dicom_id", "dicom"."file_path" AS "dicom_file_path" FROM "upload_job" "upload_job" LEFT JOIN "study" "study" ON "upload_job"."id" = "study"."upload_job_id"  LEFT JOIN "user" "user" ON  "upload_job"."user_id" = "user"."id" AND "user"."deleted_at" IS NULL  LEFT JOIN "dicom" "dicom" ON "study"."id" = "dicom"."study_id"',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW", "upload_job_view", "public"]);
    await queryRunner.query(`DROP VIEW "upload_job_view"`);
  }
}
