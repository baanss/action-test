import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-06
 *
 * Update clinical_info.target_date
 * Add clinical_info.operation_date
 * Add clinical_info.memo
 * Add clinical_info.remark
 */
export class Test1693986488873 implements MigrationInterface {
  name = "Test1693986488873";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clinical_info" RENAME COLUMN "target_date" TO "delivery_date"`);
    await queryRunner.query(`ALTER TABLE "clinical_info" ADD "operation_date" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "clinical_info" ADD "memo" character varying`);
    await queryRunner.query(`ALTER TABLE "clinical_info" ADD "remark" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clinical_info" DROP COLUMN "remark"`);
    await queryRunner.query(`ALTER TABLE "clinical_info" DROP COLUMN "memo"`);
    await queryRunner.query(`ALTER TABLE "clinical_info" DROP COLUMN "operation_date"`);
    await queryRunner.query(`ALTER TABLE "clinical_info" RENAME COLUMN "delivery_date" TO "target_date"`);
  }
}
