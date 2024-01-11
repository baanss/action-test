import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.0.0
 * timestamp: 2022-05-20
 * migration compatibility: v1.0.3+
 * * migration compatibility 아닌 버전에서는 마이그레이션이 지원되지 않습니다. 본 마이그레이션의 쿼리가 실행되지 않아야 합니다.
 * * 호환 불가 버전: v1.0.0, v1.0.1, v1.0.2
 * * 원인: 해당 버전에 init.sql 파일 지원되어 쿼리가 충돌함
 *
 * Create collation.numeric
 */
export class Test1653009149164 implements MigrationInterface {
  name = "Test1653009149164";
  db_migration_from = process.env.DB_MIGRATION_FROM;

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (this.db_migration_from.startsWith("v1.0.0") || this.db_migration_from.startsWith("v1.0.1") || this.db_migration_from.startsWith("v1.0.2")) {
      return;
    }
    //  collation 추가
    await queryRunner.query("CREATE COLLATION IF NOT EXISTS numeric (provider = icu, locale = 'en-u-kn-true');");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    //  collation 제거
    await queryRunner.query("DROP COLLATION numeric");
  }
}
