import { TotalCreditView } from "@src/common/entity/total-credit.view.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(TotalCreditView)
export class TotalCreditViewRepository extends Repository<TotalCreditView> {
  async getTotalCredit(): Promise<number> {
    return this.findOne().then((result) => Number(result?.totalCredit ?? "0"));
  }
}
