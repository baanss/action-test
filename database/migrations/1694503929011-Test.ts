import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-12
 *
 * Create recipient
 */
export class Test1694503929011 implements MigrationInterface {
  name = "Test1694503929011";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "recipient" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "email" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9f7a695711b2055e3c8d5cfcfa1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "FK_a1c20010585ef622783c15f28e8" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "FK_a1c20010585ef622783c15f28e8"`);
    await queryRunner.query(`DROP TABLE "recipient"`);
  }
}
