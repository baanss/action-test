import * as xlsx from "xlsx";
import * as moment from "moment-timezone";

import { Injectable } from "@nestjs/common";
import { XlsxOptions } from "@src/credit-history/interface/xlsx-options.interface";
import { BalanceView } from "@src/common/entity/balance.view.entity";
import { CreditCategory } from "@src/common/entity/credit-history.entity";

@Injectable()
export class ExportCreditHistoryService {
  private fields: string[];

  constructor() {
    this.fields = ["Date/Time", "Category", "huID", "ID", "Name", "Change", "Balance"];
  }

  convertToXlsx(creditHistories: BalanceView[], xlsxOptions?: XlsxOptions) {
    const data = creditHistories.map((balanceView) => {
      const row = {};
      row[this.fields[0]] = moment(balanceView.createdAt).tz(xlsxOptions.timezone).format("YYYY.MM.DD HH.mm");
      row[this.fields[1]] = this.transformCategory(balanceView.category);
      row[this.fields[2]] = balanceView.huId ?? "-";
      row[this.fields[3]] = balanceView.employeeId;
      row[this.fields[4]] = balanceView.name;
      if (balanceView.quantity > 0) {
        row[this.fields[5]] = `+${balanceView.quantity}`;
      } else {
        row[this.fields[5]] = `${balanceView.quantity}`;
      }
      row[this.fields[6]] = Number(balanceView.balance);

      return row;
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");

    return xlsx.write(wb, { bookType: "xlsx", type: "buffer" });
  }

  transformCategory(category: CreditCategory): string {
    switch (category) {
      case CreditCategory.RUS_USE:
        return "RUS Use";
      case CreditCategory.RUS_CANCEL:
        return "RUS Cancel";
      case CreditCategory.ALLOCATE:
        return "Allocate";
      case CreditCategory.REVOKE:
        return "Revoke";
      // FIXME? default vs throw error
      default:
        return category;
    }
  }

  createFileName() {
    const transformedDate = moment().format("YYYYMMDD");

    return `Credit_History_${transformedDate}.xlsx`;
  }
}
