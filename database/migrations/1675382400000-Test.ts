import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.0.1
 * timestamp: 2023-02-03
 * migration compatibility: v1.0.3+
 * * migration compatibility 아닌 버전에서는 마이그레이션이 지원되지 않습니다. 본 마이그레이션의 쿼리가 실행되지 않아야 합니다.
 * * 호환 불가 버전: v1.0.0, v1.0.1, v1.0.2
 * * 원인: 해당 버전에 init.sql 파일 지원되어 쿼리가 충돌함
 *
 * Create tables
 */
export class Test1675382400000 implements MigrationInterface {
  name = "Test1675382400000";
  db_migration_from = process.env.DB_MIGRATION_FROM;

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (this.db_migration_from.startsWith("v1.0.0") || this.db_migration_from.startsWith("v1.0.1") || this.db_migration_from.startsWith("v1.0.2")) {
      return;
    }

    await queryRunner.query(
      'CREATE TABLE "dicom" ("id" SERIAL NOT NULL, "study_id" integer NOT NULL, "file_path" character varying, "file_name" character varying NOT NULL, "file_size" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0f46315a74975b6e9798c07a4aa" UNIQUE ("study_id"), CONSTRAINT "UQ_72b6f252aade5f780e4e92fcecd" UNIQUE ("file_name"), CONSTRAINT "REL_0f46315a74975b6e9798c07a4a" UNIQUE ("study_id"), CONSTRAINT "PK_be8816cd4134853acbcfc372f28" PRIMARY KEY ("id"))'
    );
    await queryRunner.query("CREATE TYPE \"public\".\"study_sex_enum\" AS ENUM('F', 'M', 'O')");
    await queryRunner.query(
      'CREATE TABLE "study" ("id" SERIAL NOT NULL, "hu_id" character varying COLLATE "numeric" NOT NULL, "patient_id" character varying NOT NULL, "patient_name" character varying NOT NULL, "study_date" TIMESTAMP WITH TIME ZONE NOT NULL, "study_description" character varying NOT NULL, "series_count" smallint NOT NULL, "instances_count" smallint NOT NULL, "age" smallint, "sex" "public"."study_sex_enum", "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_registerd" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_a354c23ff201a90684b6f27fe96" UNIQUE ("hu_id"), CONSTRAINT "PK_ae14dbea0172b8521edb2ce4597" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "clinical_info" ("id" SERIAL NOT NULL, "rus_case_id" integer NOT NULL, "operation_type" character varying NOT NULL, "target_date" TIMESTAMP WITH TIME ZONE NOT NULL, "age" smallint NOT NULL DEFAULT \'0\', "sex" character varying NOT NULL, "height" double precision NOT NULL, "weight" double precision NOT NULL, "childbirth" boolean NOT NULL, CONSTRAINT "UQ_1676cd31a6f285a4692d470df0f" UNIQUE ("rus_case_id"), CONSTRAINT "REL_1676cd31a6f285a4692d470df0" UNIQUE ("rus_case_id"), CONSTRAINT "PK_99960df8ad77b7d8c192b2b99d7" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "hu3d" ("id" SERIAL NOT NULL, "rus_case_id" integer NOT NULL, "file_path" character varying, "file_name" character varying NOT NULL, "file_size" integer NOT NULL, "version" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_308011a02a97a84b3909119223d" UNIQUE ("rus_case_id"), CONSTRAINT "UQ_eb816a822bf8fcc93c2e671ac7a" UNIQUE ("file_name"), CONSTRAINT "REL_308011a02a97a84b3909119223" UNIQUE ("rus_case_id"), CONSTRAINT "PK_55e1781fc02a22f891aa9f58dbc" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "department" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "order" smallint NOT NULL, CONSTRAINT "UQ_471da4b90e96c1ebe0af221e07b" UNIQUE ("name"), CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "notification" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "category" character varying NOT NULL, "message" character varying NOT NULL, "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "permission_request" ("id" SERIAL NOT NULL, "manager_id" integer NOT NULL, "employee_id" character varying COLLATE "numeric" NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying COLLATE "numeric" NOT NULL, "phone_number" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_51c199f6e5ba6c10c5522f695e5" UNIQUE ("employee_id"), CONSTRAINT "UQ_2c753fc21406a27072bac3cadc4" UNIQUE ("email"), CONSTRAINT "PK_0956b53ddae7aef640e8cc5e9c6" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "reset_password_request" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_376aaf37e788563ad28f8a5381" UNIQUE ("user_id"), CONSTRAINT "PK_74675f940551b34f6e321247b81" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "credit_history" ("id" SERIAL NOT NULL, "user_id" integer, "employee_id" character varying COLLATE "numeric" NOT NULL, "email" character varying NOT NULL, "name" character varying COLLATE "numeric" NOT NULL, "department_name" character varying, "description" character varying NOT NULL, "counterpart_id" character varying, "change" integer NOT NULL, "total_credit" integer, "requestor_id" character varying, "manager_id" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1f23079c40e17baba72a8f83d41" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "user" ("id" SERIAL NOT NULL, "manager_id" integer, "department_id" integer, "employee_id" character varying COLLATE "numeric" NOT NULL, "password" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying COLLATE "numeric" NOT NULL, "credit" smallint, "phone_number" character varying, "notification_type" character varying array NOT NULL DEFAULT \'{}\', "profile_path" character varying, "sign_in_failed" integer NOT NULL DEFAULT \'0\', "show_guide" boolean NOT NULL DEFAULT true, "role" character varying NOT NULL, "last_login" TIMESTAMP WITH TIME ZONE, "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_135936b6918bd375a4479b92311" UNIQUE ("employee_id"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "CHK_ff8d88ad5c4ab7144d1e67ba3b" CHECK (credit >= 0 and credit <= 9999), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "rus_case" ("id" SERIAL NOT NULL, "user_id" integer, "status" character varying NOT NULL DEFAULT \'IN_PROGRESS\', "study_id" integer NOT NULL, CONSTRAINT "UQ_8934b89bc9180138172aca29fc2" UNIQUE ("study_id"), CONSTRAINT "REL_8934b89bc9180138172aca29fc" UNIQUE ("study_id"), CONSTRAINT "PK_2fd91b47f52fe74b992d72bbe78" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "rus_case_id" integer NOT NULL, "message" character varying NOT NULL, "writer_user_id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e1efb032c59d036f05ac10ed2d0" UNIQUE ("rus_case_id"), CONSTRAINT "REL_e1efb032c59d036f05ac10ed2d" UNIQUE ("rus_case_id"), CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "installer" ("id" SERIAL NOT NULL, "file_name" character varying NOT NULL, "file_path" character varying, "file_size" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7dd5072eb8d050814229f589bdc" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "upload_job" ("id" SERIAL NOT NULL, "hu_id" character varying COLLATE "numeric" NOT NULL, "ae_mode" character varying, "status" character varying NOT NULL DEFAULT \'IN_PROGRESS\', "message" character varying, "study_id" integer, "is_aquired" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_eb6d8329c9568e90e8ae76b3131" UNIQUE ("hu_id"), CONSTRAINT "PK_5d9d3a63b057c2d0a5632e0645a" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "qr_job" ("id" SERIAL NOT NULL, "user_id" integer, "study_instance_uid" character varying NOT NULL, "patient_id" character varying NOT NULL, "patient_name" character varying, "upload_job_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_fb8fe2cc8c4f06e969e00784c3" UNIQUE ("upload_job_id"), CONSTRAINT "PK_0371d5ac37336e7d8fc25d27642" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'CREATE TABLE "update_log" ("id" SERIAL NOT NULL, "file_name" character varying NOT NULL, "file_path" character varying, "file_size" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6656720d7f1dd63cc412fe4cd39" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'ALTER TABLE "dicom" ADD CONSTRAINT "FK_0f46315a74975b6e9798c07a4aa" FOREIGN KEY ("study_id") REFERENCES "study"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "clinical_info" ADD CONSTRAINT "FK_1676cd31a6f285a4692d470df0f" FOREIGN KEY ("rus_case_id") REFERENCES "rus_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "hu3d" ADD CONSTRAINT "FK_308011a02a97a84b3909119223d" FOREIGN KEY ("rus_case_id") REFERENCES "rus_case"("id") ON DELETE NO ACTION ON UPDATE CASCADE'
    );
    await queryRunner.query(
      'ALTER TABLE "notification" ADD CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "permission_request" ADD CONSTRAINT "FK_90995b92481cfec1e858aca691f" FOREIGN KEY ("manager_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "reset_password_request" ADD CONSTRAINT "FK_376aaf37e788563ad28f8a5381a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "credit_history" ADD CONSTRAINT "FK_60fc91f5da4ba4ffb898a6fbd68" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "user" ADD CONSTRAINT "FK_b925754780ce53c20179d7204f9" FOREIGN KEY ("manager_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "user" ADD CONSTRAINT "FK_afd2c87bee70dd5557f48911e66" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "rus_case" ADD CONSTRAINT "FK_1e5d274b1d983828939a443db16" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "rus_case" ADD CONSTRAINT "FK_8934b89bc9180138172aca29fc2" FOREIGN KEY ("study_id") REFERENCES "study"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "feedback" ADD CONSTRAINT "FK_e1efb032c59d036f05ac10ed2d0" FOREIGN KEY ("rus_case_id") REFERENCES "rus_case"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await queryRunner.query(
      'ALTER TABLE "qr_job" ADD CONSTRAINT "FK_fb8fe2cc8c4f06e969e00784c37" FOREIGN KEY ("upload_job_id") REFERENCES "upload_job"("id") ON DELETE NO ACTION ON UPDATE CASCADE'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "qr_job" DROP CONSTRAINT "FK_fb8fe2cc8c4f06e969e00784c37"');
    await queryRunner.query('ALTER TABLE "feedback" DROP CONSTRAINT "FK_e1efb032c59d036f05ac10ed2d0"');
    await queryRunner.query('ALTER TABLE "rus_case" DROP CONSTRAINT "FK_8934b89bc9180138172aca29fc2"');
    await queryRunner.query('ALTER TABLE "rus_case" DROP CONSTRAINT "FK_1e5d274b1d983828939a443db16"');
    await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "FK_afd2c87bee70dd5557f48911e66"');
    await queryRunner.query('ALTER TABLE "user" DROP CONSTRAINT "FK_b925754780ce53c20179d7204f9"');
    await queryRunner.query('ALTER TABLE "credit_history" DROP CONSTRAINT "FK_60fc91f5da4ba4ffb898a6fbd68"');
    await queryRunner.query('ALTER TABLE "reset_password_request" DROP CONSTRAINT "FK_376aaf37e788563ad28f8a5381a"');
    await queryRunner.query('ALTER TABLE "permission_request" DROP CONSTRAINT "FK_90995b92481cfec1e858aca691f"');
    await queryRunner.query('ALTER TABLE "notification" DROP CONSTRAINT "FK_928b7aa1754e08e1ed7052cb9d8"');
    await queryRunner.query('ALTER TABLE "hu3d" DROP CONSTRAINT "FK_308011a02a97a84b3909119223d"');
    await queryRunner.query('ALTER TABLE "clinical_info" DROP CONSTRAINT "FK_1676cd31a6f285a4692d470df0f"');
    await queryRunner.query('ALTER TABLE "dicom" DROP CONSTRAINT "FK_0f46315a74975b6e9798c07a4aa"');
    await queryRunner.query('DROP TABLE "update_log"');
    await queryRunner.query('DROP TABLE "qr_job"');
    await queryRunner.query('DROP TABLE "upload_job"');
    await queryRunner.query('DROP TABLE "installer"');
    await queryRunner.query('DROP TABLE "feedback"');
    await queryRunner.query('DROP TABLE "rus_case"');
    await queryRunner.query('DROP TABLE "user"');
    await queryRunner.query('DROP TABLE "credit_history"');
    await queryRunner.query('DROP TABLE "reset_password_request"');
    await queryRunner.query('DROP TABLE "permission_request"');
    await queryRunner.query('DROP TABLE "notification"');
    await queryRunner.query('DROP TABLE "department"');
    await queryRunner.query('DROP TABLE "hu3d"');
    await queryRunner.query('DROP TABLE "clinical_info"');
    await queryRunner.query('DROP TABLE "study"');
    await queryRunner.query('DROP TYPE "public"."study_sex_enum"');
    await queryRunner.query('DROP TABLE "dicom"');
  }
}
