import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.0.3
 * timestamp: 2023-07-28
 *
 * Update session.access_token To session_token
 * Add session.expires_in
 */
export class Test1690523040711 implements MigrationInterface {
  name = "Test1690523040711";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "session" RENAME COLUMN "access_token" TO "session_token"`);
    await queryRunner.query(`ALTER TABLE "session" ADD "expires_in" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "expires_in"`);
    await queryRunner.query(`ALTER TABLE "session" RENAME COLUMN "session_token" TO "access_token"`);
  }
}
