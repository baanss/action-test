import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-11-15
 *
 * Update rusCase.status
 */
export class Test1700024824986 implements MigrationInterface {
  name = "Test1700024824986";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rus_case" ALTER COLUMN "status" SET DEFAULT 'TODO'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rus_case" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS'`);
  }
}
