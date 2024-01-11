import { Connection, ViewColumn, ViewEntity } from "typeorm";
import { CreditHistory } from "./credit-history.entity";

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select("SUM(CASE WHEN credit_history.status = true THEN credit_history.quantity ELSE 0 END)", "total_credit")
      .from(CreditHistory, "credit_history"),
})
export class TotalCreditView {
  @ViewColumn({ name: "total_credit" })
  totalCredit: number;
}
