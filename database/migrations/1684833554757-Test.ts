import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.0.2
 * timestamp: 2023-05-23
 * migration compatibility: v1.0.3+
 * * migration compatibility 아닌 버전에서는 마이그레이션이 지원되지 않습니다. 본 마이그레이션의 쿼리가 실행되지 않아야 합니다.
 * * 호환 불가 버전: v1.0.2
 * * 원인: 해당 버전에 init.sql 파일 지원되어 쿼리가 충돌함
 *
 * Update deparment.name
 */
export class Test1684833554757 implements MigrationInterface {
  name = "Test1684833554757";
  db_migration_from = process.env.DB_MIGRATION_FROM;

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (this.db_migration_from.startsWith("v1.0.2")) {
      return;
    }

    await queryRunner.query(`UPDATE department SET name = 'UG' WHERE name = 'GS'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE department SET name = 'GS' WHERE name = 'UG'`);
  }
}
