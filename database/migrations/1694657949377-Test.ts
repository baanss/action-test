import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * version: v1.1.0
 * timestamp: 2023-09-14
 *
 * Update user.role
 * Delete user.manager_id(FK)
 * Insert a record(user.creidt) into the 'credit_history' table
 *
 * timestamp: 2023-12-04
 *
 * Update logic about insert a record(user.credit)
 */
export class Test1694657949377 implements MigrationInterface {
  name = "Test1694657949377";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const getTotalCreditQuery = `
        SELECT total_credit
        FROM total_credit_view
      `;

    const totalCreditResult = await queryRunner.query(getTotalCreditQuery);

    if (totalCreditResult.length === 0) {
      throw new Error("Migration halted because total_credit_view's total_credit could not be fetched.");
    }

    const totalCreditInView = totalCreditResult[0].total_credit || 0;

    const getUserCreditQuery = `
        SELECT SUM(credit) as total_credits
        FROM "user"
        WHERE role <> 'admin'
      `;

    const creditSumResult = await queryRunner.query(getUserCreditQuery);
    const totalCredits = creditSumResult.length > 0 ? creditSumResult[0].total_credits || 0 : 0;

    // Stop migration(credit_history) if total_credit_view's total_credit and user credit values do not match
    if (totalCreditInView !== totalCredits) {
      console.log("Migration(credit_history) halted because total_credit_view's total_credit does not match user credit.");

      await queryRunner.query(`DELETE FROM "credit_history"`);

      const insertQuery = `
          INSERT INTO credit_history (status, quantity, category, employee_id, name, is_user_request)
          VALUES (true, $1, 'allocate', 'hutom', 'hutom', false)
        `;
      await queryRunner.query(insertQuery, [totalCredits]);
    }

    await queryRunner.query(`UPDATE "user" SET role = 'user'`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_b925754780ce53c20179d7204f9"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "manager_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "manager_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_b925754780ce53c20179d7204f9" FOREIGN KEY ("manager_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
