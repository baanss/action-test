import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-05
 *
 * Add study.upload_job_id
 * Add study.uploadJob FK(study)
 *
 * timestamp: 2023-11-30
 * Add query to update study.upload_job_id from upload_job
 */
export class Test1693876792385 implements MigrationInterface {
  name = "Test1693876792385";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "study" ADD "upload_job_id" integer`);

    // Update study table with corresponding upload_job_id from upload_job table
    await queryRunner.query(`
      UPDATE "study" AS s
      SET upload_job_id = uj.id
      FROM "upload_job" AS uj
      WHERE uj.study_id = s.id
    `);

    await queryRunner.query(`ALTER TABLE "study" ADD CONSTRAINT "UQ_028d771dfcf5f3eb7bdab06bf33" UNIQUE ("upload_job_id")`);
    await queryRunner.query(
      `ALTER TABLE "study" ADD CONSTRAINT "FK_028d771dfcf5f3eb7bdab06bf33" FOREIGN KEY ("upload_job_id") REFERENCES "upload_job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "study" DROP CONSTRAINT "FK_028d771dfcf5f3eb7bdab06bf33"`);
    await queryRunner.query(`ALTER TABLE "study" DROP CONSTRAINT "UQ_028d771dfcf5f3eb7bdab06bf33"`);
    await queryRunner.query(`ALTER TABLE "study" DROP COLUMN "upload_job_id"`);
  }
}
