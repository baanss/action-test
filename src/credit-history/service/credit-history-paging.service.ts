import { Injectable } from "@nestjs/common";

import { BalanceViewRepository } from "@src/credit-history/repository/balance-view.repository";
import { GetManyCreditHistoryBalanceViewServiceReq } from "@src/credit-history/dto/in/get-many-credit-history-balance.view.service-request.dto";
import { BalanceView } from "@src/common/entity/balance.view.entity";

export enum MyCreditHistoryRequestedBy {
  ME = "me",
  OTHERS = "others",
  HUTOM = "hutom",
}
@Injectable()
export class CreditHistoryPagingService {
  constructor(private readonly balanceViewRepository: BalanceViewRepository) {}

  getManyAndCount(conditions: GetManyCreditHistoryBalanceViewServiceReq): Promise<[BalanceView[], number]> {
    return this.balanceViewRepository.getManyAndCount(conditions);
  }
}
