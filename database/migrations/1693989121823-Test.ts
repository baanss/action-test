import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-06
 *
 * Delete creditHistory.email
 * Delete creditHistory.department_name
 * Update creditHistory.description to category
 * Delete creditHistory.counterpart_id
 * Update creditHistory.change to quantity
 * Delete creditHistory.total_credit
 * Delete creditHistory.requestor_id
 * Delete creditHistory.manager_id
 * Add creditHistory.status
 * Add creditHistory.is_user_request
 * Add creditHistory.hu_id
 * Add creditHistory.updated_at
 *
 * timestamp: 2023-09-21
 * Delete creditHistory.is_user_request default
 *
 * timestamp: 2023-12-04
 * Add initialize query at creditHistory.status
 * Add initialize query at creditHistory.is_user_request
 * Update credit_history table to migrate. (v1.0.3-h1 -> v1.1.0)
 * 0. Delete rows that don't meet the conditions 1~4
 * 1. Update rows where user role is admin, category is order, and quantity is negative
 * 2. Update rows where user role is admin, category is refund, and quantity is positive
 * 3. Update rows where user role is user, category is rus-used and quantity is negative
 * 4. Update rows where user role is user, category is rus-cancel and quantity is positive
 */
export class Test1693989121823 implements MigrationInterface {
  name = "Test1693989121823";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "department_name"`);
    await queryRunner.query(`ALTER TABLE "credit_history" RENAME COLUMN "description" TO "category"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "counterpart_id"`);
    await queryRunner.query(`ALTER TABLE "credit_history" RENAME COLUMN "change" TO "quantity"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "total_credit"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "requestor_id"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "manager_id"`);

    // Add initialize query at creditHistory.status
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "status" boolean`);
    await queryRunner.query(`
      UPDATE "credit_history"
      SET "status" = true
      WHERE "status" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "credit_history" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "credit_history" ALTER COLUMN "status" SET DEFAULT false`);

    // Add initialize query at creditHistory.is_user_request
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "is_user_request" boolean`);
    await queryRunner.query(`
      UPDATE "credit_history"
      SET "is_user_request" = true
      WHERE "is_user_request" IS NULL
    `);
    await queryRunner.query(`ALTER TABLE "credit_history" ALTER COLUMN "is_user_request" SET NOT NULL`);

    // Update credit_history table to migrate. (v1.0.3-h1 -> v1.1.0)
    // 0. Delete rows that don't meet the conditions 1~4
    await queryRunner.query(`
      DELETE FROM "credit_history"
      WHERE NOT (
        ("user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'admin') AND "category" = 'order' AND "quantity" < 0) OR
        ("user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'admin') AND "category" = 'refund' AND "quantity" > 0) OR
        ("user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'user') AND "category" = 'rus-used' AND "quantity" < 0) OR
        ("user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'user') AND "category" = 'rus-cancel' AND "quantity" > 0)
      )
    `);

    // 1. Update rows where user role is admin, category is order, and quantity is negative
    await queryRunner.query(`
      UPDATE "credit_history"
      SET
        "category" = 'allocate',
        "quantity" = ABS("quantity"),
        "is_user_request" = false,
        "user_id" = NULL,
        "employee_id" = 'hutom',
        "name" = 'hutom'
      WHERE
        "user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'admin')
        AND "category" = 'order'
        AND "quantity" < 0
    `);

    // 2. Update rows where user role is admin, category is refund, and quantity is positive
    await queryRunner.query(`
      UPDATE "credit_history"
      SET
        "category" = 'revoke',
        "quantity" = -"quantity",
        "is_user_request" = false,
        "user_id" = NULL,
        "employee_id" = 'hutom',
        "name" = 'hutom'
      WHERE
        "user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'admin')
        AND "category" = 'refund'
        AND "quantity" > 0
    `);

    // 3. Update rows where user role is user, category is rus-used and quantity is negative
    await queryRunner.query(`
      UPDATE "credit_history"
      SET
        "category" = 'rus-use',
        "is_user_request" = true
      WHERE
        "user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'user')
        AND "category" = 'rus-used'
        AND "quantity" < 0
    `);

    // 4. Update rows where user role is user, category is rus-cancel and quantity is positive
    await queryRunner.query(`
      UPDATE "credit_history"
      SET
        "is_user_request" = false,
        "user_id" = NULL,
        "employee_id" = 'hutom',
        "name" = 'hutom'
      WHERE
        "user_id" IN (SELECT "id" FROM "user" WHERE "role" = 'user')
        AND "category" = 'rus-cancel'
        AND "quantity" > 0
    `);

    await queryRunner.query(`ALTER TABLE "credit_history" ADD "hu_id" character varying`);
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "hu_id"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "is_user_request"`);
    await queryRunner.query(`ALTER TABLE "credit_history" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "manager_id" character varying`);
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "requestor_id" character varying`);
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "total_credit" integer`);
    await queryRunner.query(`ALTER TABLE "credit_history" RENAME COLUMN "quantity" TO "change"`);
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "counterpart_id" character varying`);
    await queryRunner.query(`ALTER TABLE "credit_history" RENAME COLUMN "category" TO "description"`);
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "department_name" character varying`);
    await queryRunner.query(`ALTER TABLE "credit_history" ADD "email" character varying NOT NULL`);
  }
}
