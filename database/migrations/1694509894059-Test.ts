import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-12
 *
 * Delete qr_job
 */
export class Test1694509894059 implements MigrationInterface {
  name = "Test1694509894059";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "qr_job"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "qr_job" ("id" SERIAL NOT NULL, "user_id" integer, "study_instance_uid" character varying, "patient_id" character varying NOT NULL, "patient_name" character varying, "upload_job_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_fb8fe2cc8c4f06e969e00784c3" UNIQUE ("upload_job_id"), CONSTRAINT "PK_0371d5ac37336e7d8fc25d27642" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "qr_job" ADD CONSTRAINT "FK_fb8fe2cc8c4f06e969e00784c37" FOREIGN KEY ("upload_job_id") REFERENCES "upload_job"("id") ON DELETE NO ACTION ON UPDATE CASCADE`
    );
  }
}
