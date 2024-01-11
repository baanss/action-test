import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-14
 *
 * Delete department
 */
export class Test1694654996797 implements MigrationInterface {
  name = "Test1694654996797";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_afd2c87bee70dd5557f48911e66"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "department_id"`);
    await queryRunner.query(`DROP TABLE "department"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "department_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_afd2c87bee70dd5557f48911e66" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      'CREATE TABLE "department" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "order" smallint NOT NULL, CONSTRAINT "UQ_471da4b90e96c1ebe0af221e07b" UNIQUE ("name"), CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))'
    );
  }
}
