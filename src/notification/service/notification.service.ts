import { Injectable } from "@nestjs/common";

import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { GetMyNotiQuery } from "@src/notification/dto/in/get-my-noti-query";

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async getMyNotiAndCountByUserId(userId: number, conditions: GetMyNotiQuery) {
    const beforeUpdateReadTrue = await this.notificationRepository.findByUserIdAndCount(userId, conditions);

    // read: false => true (일괄 읽음 처리)
    // TODO: afterLoad 로 리팩터
    await this.notificationRepository.update({ userId }, { read: true });
    return beforeUpdateReadTrue;
  }

  async getUnreadCountByUserId(userId: number) {
    const unreadCount = await this.notificationRepository.count({ userId, read: false });
    return { unreadCount };
  }
}
