import { Connection, EntitySubscriberInterface, EventSubscriber, InsertEvent } from "typeorm";
import { Logger } from "@nestjs/common";

import { Category } from "@src/common/entity/notification.entity";

import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { UserRepository } from "@src/user/repository/user.repository";
import { CreditHistory } from "@src/common/entity/credit-history.entity";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";

@EventSubscriber()
export class CreditHistorySubscriber implements EntitySubscriberInterface<CreditHistory> {
  private readonly logger = new Logger(CreditHistorySubscriber.name);
  constructor(connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return CreditHistory;
  }

  async afterInsert(event: InsertEvent<CreditHistory>) {
    const updatedEntity = event.entity;

    if (updatedEntity.quantity > 0) {
      return;
    }

    const notificationRepository = event.manager.getCustomRepository(NotificationRepository);
    const userRepository = event.manager.getCustomRepository(UserRepository);
    const totalCreditViewRepository = event.manager.getCustomRepository(TotalCreditViewRepository);

    const admin = await userRepository.getAdmin();
    if (!admin) {
      return this.logger.log("E: Fail to create [CREDIT_SHORTAGE] notification, admin not found");
    }
    const totalCredit = await totalCreditViewRepository.getTotalCredit();
    const creditShortageThreshold = 9;
    if (totalCredit === creditShortageThreshold) {
      await notificationRepository.createOne({ userId: admin.id, category: Category.CREDIT_SHORTAGE, credits: totalCredit });
    }
  }
}
