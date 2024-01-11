import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.0.3
 * timestamp: 2023-07-14
 *
 * Add upload_job.instances_count
 * Update qr_job.study_instance_uid
 */
export class Test1689312222493 implements MigrationInterface {
  name = "Test1689312222493";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "upload_job" ADD "instances_count" integer`);
    await queryRunner.query(`ALTER TABLE "qr_job" ALTER COLUMN "study_instance_uid" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "qr_job" ALTER COLUMN "study_instance_uid" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "upload_job" DROP COLUMN "instances_count"`);
  }
}
