import { Connection, ViewColumn, ViewEntity } from "typeorm";
import { CreditCategory, CreditHistory } from "./credit-history.entity";

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select("credit_history.id", "id")
      .addSelect("credit_history.created_at", "created_at")
      .addSelect("credit_history.category", "category")
      .addSelect("credit_history.hu_id", "hu_id")
      .addSelect("credit_history.employee_id", "employee_id")
      .addSelect("credit_history.name", "name")
      .addSelect("credit_history.quantity", "quantity")
      .addSelect("credit_history.status", "status")
      .addSelect("credit_history.user_id", "user_id")
      .addSelect("credit_history.is_user_request", "is_user_request")
      .addSelect(
        "SUM(CASE WHEN credit_history.status = true THEN credit_history.quantity ELSE 0 END) OVER (ORDER BY credit_history.created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)",
        "balance",
      )
      .from(CreditHistory, "credit_history"),
})
export class BalanceView {
  @ViewColumn({ name: "id" })
  id: number;

  @ViewColumn({ name: "created_at" })
  createdAt: Date;

  @ViewColumn({ name: "category" })
  category: CreditCategory;

  @ViewColumn({ name: "hu_id" })
  huId: string;

  @ViewColumn({ name: "employee_id" })
  employeeId: string;

  @ViewColumn({ name: "name" })
  name: string;

  @ViewColumn({ name: "quantity" })
  quantity: number;

  @ViewColumn({ name: "status" })
  status: boolean;

  @ViewColumn({ name: "user_id" })
  userId: number;

  @ViewColumn({ name: "is_user_request" })
  isUserRequest: boolean;

  @ViewColumn({ name: "balance" })
  balance: number;
}
