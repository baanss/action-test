import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-11
 *
 * Create balance_view
 * Add typeorm_metadata(balance_view)
 * Create total_credit_view
 * Add typeorm_metadata(total_credit_view)
 */
export class Test1694063236508 implements MigrationInterface {
  name = "Test1694063236508";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "balance_view" AS SELECT "credit_history"."id" AS "id", "credit_history"."name" AS "name", "credit_history"."category" AS "category", "credit_history"."quantity" AS "quantity", "credit_history"."status" AS "status", "credit_history"."created_at" AS "created_at", "credit_history"."hu_id" AS "hu_id", "credit_history"."employee_id" AS "employee_id", "credit_history"."user_id" AS "user_id", "credit_history"."is_user_request" AS "is_user_request", SUM(CASE WHEN "credit_history"."status" = true THEN "credit_history"."quantity" ELSE 0 END) OVER (ORDER BY "credit_history"."created_at" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "balance" FROM "credit_history" "credit_history"`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "balance_view",
        'SELECT "credit_history"."id" AS "id", "credit_history"."name" AS "name", "credit_history"."category" AS "category", "credit_history"."quantity" AS "quantity", "credit_history"."status" AS "status", "credit_history"."created_at" AS "created_at", "credit_history"."hu_id" AS "hu_id", "credit_history"."employee_id" AS "employee_id", "credit_history"."user_id" AS "user_id", "credit_history"."is_user_request" AS "is_user_request", SUM(CASE WHEN "credit_history"."status" = true THEN "credit_history"."quantity" ELSE 0 END) OVER (ORDER BY "credit_history"."created_at" ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "balance" FROM "credit_history" "credit_history"',
      ]
    );
    await queryRunner.query(
      `CREATE VIEW "total_credit_view" AS SELECT SUM(CASE WHEN "credit_history"."status" = true THEN "credit_history"."quantity" ELSE 0 END) AS "total_credit" FROM "credit_history" "credit_history"`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "total_credit_view",
        'SELECT SUM(CASE WHEN "credit_history"."status" = true THEN "credit_history"."quantity" ELSE 0 END) AS "total_credit" FROM "credit_history" "credit_history"',
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW", "total_credit_view", "public"]);
    await queryRunner.query(`DROP VIEW "total_credit_view"`);
    await queryRunner.query(`DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW", "balance_view", "public"]);
    await queryRunner.query(`DROP VIEW "balance_view"`);
  }
}
