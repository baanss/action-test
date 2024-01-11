import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-12
 *
 * Create rusCaseView(table: rusCase, study, clinicalInfo, surgeon, user, feedback, hu3d, dicom)
 * Add typeorm_metadata(rusCaseView)
 */
export class Test1694483794813 implements MigrationInterface {
  name = "Test1694483794813";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "rus_case_view" AS SELECT "rus_case"."id" AS "id", "rus_case"."status" AS "status", "study"."hu_id" AS "hu_id", "clinical_info"."age" AS "age", "clinical_info"."sex" AS "sex", "clinical_info"."height" AS "height", "clinical_info"."weight" AS "weight", "clinical_info"."childbirth" AS "childbirth", "clinical_info"."memo" AS "memo", "clinical_info"."remark" AS "remark", "surgeon"."name" AS "srugeon_name", "user"."id" AS "user_id", "user"."name" AS "user_name", "feedback"."id" AS "feedback_id", "study"."patient_id" AS "patient_id", "study"."patient_name" AS "patient_name", "clinical_info"."operation_type" AS "operation_type", "clinical_info"."delivery_date" AS "delivery_date", "clinical_info"."operation_date" AS "operation_date", "hu3d"."file_path" AS "hu3d_file_path", "dicom"."file_path" AS "dicom_file_path" FROM "rus_case" "rus_case" LEFT JOIN "study" "study" ON "rus_case"."study_id" = "study"."id"  LEFT JOIN "clinical_info" "clinical_info" ON "rus_case"."id" = "clinical_info"."rus_case_id"  LEFT JOIN "surgeon" "surgeon" ON "rus_case"."surgeon_id" = "surgeon"."id"  LEFT JOIN "user" "user" ON  "rus_case"."user_id" = "user"."id" AND "user"."deleted_at" IS NULL  LEFT JOIN "feedback" "feedback" ON "rus_case"."id" = "feedback"."rus_case_id"  LEFT JOIN "hu3d" "hu3d" ON "rus_case"."id" = "hu3d"."rus_case_id"  LEFT JOIN "dicom" "dicom" ON "study"."id" = "dicom"."study_id"`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "rus_case_view",
        'SELECT "rus_case"."id" AS "id", "rus_case"."status" AS "status", "study"."hu_id" AS "hu_id", "clinical_info"."age" AS "age", "clinical_info"."sex" AS "sex", "clinical_info"."height" AS "height", "clinical_info"."weight" AS "weight", "clinical_info"."childbirth" AS "childbirth", "clinical_info"."memo" AS "memo", "clinical_info"."remark" AS "remark", "surgeon"."name" AS "srugeon_name", "user"."id" AS "user_id", "user"."name" AS "user_name", "feedback"."id" AS "feedback_id", "study"."patient_id" AS "patient_id", "study"."patient_name" AS "patient_name", "clinical_info"."operation_type" AS "operation_type", "clinical_info"."delivery_date" AS "delivery_date", "clinical_info"."operation_date" AS "operation_date", "hu3d"."file_path" AS "hu3d_file_path", "dicom"."file_path" AS "dicom_file_path" FROM "rus_case" "rus_case" LEFT JOIN "study" "study" ON "rus_case"."study_id" = "study"."id"  LEFT JOIN "clinical_info" "clinical_info" ON "rus_case"."id" = "clinical_info"."rus_case_id"  LEFT JOIN "surgeon" "surgeon" ON "rus_case"."surgeon_id" = "surgeon"."id"  LEFT JOIN "user" "user" ON  "rus_case"."user_id" = "user"."id" AND "user"."deleted_at" IS NULL  LEFT JOIN "feedback" "feedback" ON "rus_case"."id" = "feedback"."rus_case_id"  LEFT JOIN "hu3d" "hu3d" ON "rus_case"."id" = "hu3d"."rus_case_id"  LEFT JOIN "dicom" "dicom" ON "study"."id" = "dicom"."study_id"',
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW", "rus_case_view", "public"]);
    await queryRunner.query(`DROP VIEW "rus_case_view"`);
  }
}
