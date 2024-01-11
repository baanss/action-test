import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-14
 *
 * Delete user.credit constraint
 * Delete user.notification_type
 * Delete user.credit
 * Add user.enable_email
 * Add user.password_setting_at
 * Add user.init_password
 *
 * timestamp: 2023-09-21
 * Add user.password_setting_at default value
 */
export class Test1694675863031 implements MigrationInterface {
  name = "Test1694675863031";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "CHK_ff8d88ad5c4ab7144d1e67ba3b"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "notification_type"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "credit"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "enable_email" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "user" ADD "password_setting_at" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "user" ADD "init_password" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "init_password"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password_setting_at"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "enable_email"`);
    await queryRunner.query(`ALTER TABLE "user" ADD "credit" smallint`);
    await queryRunner.query(`ALTER TABLE "user" ADD "notification_type" character varying array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "CHK_ff8d88ad5c4ab7144d1e67ba3b" CHECK (((credit >= 0) AND (credit <= 9999)))`);
  }
}
