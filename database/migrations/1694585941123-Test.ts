import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-13
 *
 * Delete reset_password_request
 */
export class Test1694585941123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reset_password_request"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "reset_password_request" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "REL_376aaf37e788563ad28f8a5381" UNIQUE ("user_id"), CONSTRAINT "PK_74675f940551b34f6e321247b81" PRIMARY KEY ("id"))'
    );
    await queryRunner.query(
      'ALTER TABLE "reset_password_request" ADD CONSTRAINT "FK_376aaf37e788563ad28f8a5381a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION'
    );
  }
}
