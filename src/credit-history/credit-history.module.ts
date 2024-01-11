import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditHistoryController } from "@src/credit-history/credit-history.controller";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";

import { CreditHistoryService } from "@src/credit-history/service/credit-history.service";
import { CreditHistoryPagingService } from "@src/credit-history/service/credit-history-paging.service";
import { ExportCreditHistoryService } from "@src/credit-history/service/export-credit-history.service";

import { UserRepository } from "@src/user/repository/user.repository";
import { BalanceViewRepository } from "@src/credit-history/repository/balance-view.repository";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";
import { CreditHistorySubscriber } from "@src/credit-history/subscriber/credit-history.subscriber";
import { NotificationRepository } from "@src/notification/repository/notification.repository";

@Module({
  imports: [TypeOrmModule.forFeature([CreditHistoryRepository, BalanceViewRepository, UserRepository, TotalCreditViewRepository, NotificationRepository])],
  controllers: [CreditHistoryController],
  providers: [CreditHistoryService, CreditHistoryPagingService, ExportCreditHistoryService, CreditHistorySubscriber],
  exports: [CreditHistoryService],
})
export class CreditHistoryModule {}
