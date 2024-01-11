import { Connection, EntitySubscriberInterface, EventSubscriber, InsertEvent } from "typeorm";
import { Logger } from "@nestjs/common";
import { Application } from "@src/common/entity/application.entity";
import { Category } from "@src/common/entity/notification.entity";

import { UserRepository } from "@src/user/repository/user.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";

@EventSubscriber()
export class ApplicationSubscriber implements EntitySubscriberInterface<Application> {
  private readonly logger = new Logger(ApplicationSubscriber.name);
  constructor(connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo(): any {
    return Application;
  }

  async afterInsert(event: InsertEvent<Application>) {
    const { employeeId, name } = event.entity;
    const notificationRepository = event.manager.getCustomRepository(NotificationRepository);
    const userRepository = event.manager.getCustomRepository(UserRepository);

    const admin = await userRepository.getAdmin();
    if (!admin) {
      return this.logger.log("E: Fail to create [NEW_APPLICATION] notification, admin not found");
    }
    // 새로운 가입 신청 알림 생성
    const adminNotiDto = {
      userId: admin.id,
      category: Category.NEW_APPLICATION,
      userName: name,
      employeeId,
    };

    await notificationRepository.createOne(adminNotiDto);
  }
}
