import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-11
 *
 * Update feedback.writer_user_id to writer_email
 */
export class Test1694414888116 implements MigrationInterface {
  name = "Test1694414888116";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feedback" RENAME COLUMN "writer_user_id" TO "writer_email"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "feedback" RENAME COLUMN "writer_email" TO "writer_user_id"`);
  }
}
