import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-13
 * updatedAt: 2023-10-30
 *
 * Update permission_request to application
 * Delete permission_request.manager_id
 * Delete application.password
 */
export class Test1694569900196 implements MigrationInterface {
  name = "Test1694569900196";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permission_request" RENAME TO "application"`);
    await queryRunner.query(`ALTER TABLE "application" DROP CONSTRAINT "FK_90995b92481cfec1e858aca691f"`);
    await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "manager_id"`);
    await queryRunner.query(`ALTER TABLE "application" DROP COLUMN "password"`);
    await queryRunner.query(`ALTER SEQUENCE "permission_request_id_seq" RENAME TO "application_id_seq"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER SEQUENCE "application_id_seq" RENAME TO "permission_request_id_seq"`);
    await queryRunner.query(`ALTER TABLE "application" ADD "password" character varying NOT NULL`);
    // TODO? managerId nullable vs truncate
    await queryRunner.query(`ALTER TABLE "application" ADD "manager_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "application" ADD CONSTRAINT "FK_90995b92481cfec1e858aca691f" FOREIGN KEY ("manager_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "application" RENAME TO "permission_request"`);
  }
}
