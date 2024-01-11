import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.0.3
 * timestamp: 2023-06-21
 *
 * Update upload_job.study_instance_uid
 * Update study.study_description
 */
export class Test1687339100301 implements MigrationInterface {
  name = "Test1687339100301";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload_job" ADD "study_instance_uid" character varying`);
    await queryRunner.query(`ALTER TABLE "study" ALTER COLUMN "study_description" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "study" ALTER COLUMN "study_description" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "upload_job" DROP COLUMN "study_instance_uid"`);
  }
}
