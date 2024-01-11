import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-05
 *
 * Add uploadJob.patientId
 * Add uploadJob.patientName
 * Add uploadJob.age
 * Add uploadJob.sex
 * Add uploadJob.user_id
 * Add uplaodJob.user(FK)
 */
export class Test1693895282790 implements MigrationInterface {
  name = "Test1693895282790";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload_job" ADD "patient_id" character varying`);
    await queryRunner.query(`ALTER TABLE "upload_job" ADD "patient_name" character varying`);
    await queryRunner.query(`ALTER TABLE "upload_job" ADD "age" smallint`);
    await queryRunner.query(`ALTER TABLE "upload_job" ADD "sex" character(1)`);
    await queryRunner.query(`ALTER TABLE "upload_job" ADD "user_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "upload_job" ADD CONSTRAINT "FK_1b23c7406667e37573034d48817" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload_job" DROP CONSTRAINT "FK_1b23c7406667e37573034d48817"`);
    await queryRunner.query(`ALTER TABLE "upload_job" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "upload_job" DROP COLUMN "sex"`);
    await queryRunner.query(`ALTER TABLE "upload_job" DROP COLUMN "age"`);
    await queryRunner.query(`ALTER TABLE "upload_job" DROP COLUMN "patient_name"`);
    await queryRunner.query(`ALTER TABLE "upload_job" DROP COLUMN "patient_id"`);
  }
}
