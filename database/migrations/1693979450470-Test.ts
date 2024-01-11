import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-06
 *
 * Create surgeon
 * Add rusCase.surgeon_id
 * Add rusCase.surgeon(FK)
 */
export class Test1693979450470 implements MigrationInterface {
  name = "Test1693979450470";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "surgeon" ("id" SERIAL NOT NULL, "name" character varying(64) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_33599d0e004507ead10c51029e1" UNIQUE ("name"), CONSTRAINT "PK_0f2d81d1fc7eb2174694c7582c9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "rus_case" ADD "surgeon_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "rus_case" ADD CONSTRAINT "FK_aa1ee4033c781e36fa76868b321" FOREIGN KEY ("surgeon_id") REFERENCES "surgeon"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rus_case" DROP CONSTRAINT "FK_aa1ee4033c781e36fa76868b321"`);
    await queryRunner.query(`ALTER TABLE "rus_case" DROP COLUMN "surgeon_id"`);
    await queryRunner.query(`DROP TABLE "surgeon"`);
  }
}
