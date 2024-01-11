import { EntityRepository, Repository } from "typeorm";

import { Category, Notification } from "@src/common/entity/notification.entity";
import { GetMyNotiQuery } from "@src/notification/dto/in/get-my-noti-query";
import { HttpException } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@EntityRepository(Notification)
export class NotificationRepository extends Repository<Notification> {
  findByUserIdAndCount(userId: number, conditions: GetMyNotiQuery) {
    const { page, limit } = conditions;

    const query = this.createQueryBuilder("noti").where("noti.userId = :userId", { userId });

    if (limit !== -1) {
      query.offset((page - 1) * limit).limit(limit);
    }

    return query.orderBy("noti.createdAt", "DESC").getManyAndCount();
  }

  async createOne(dto: { userId: number; category: Category; credits?: number; huId?: string; userName?: string; employeeId?: string }): Promise<void> {
    const { userId, category, credits, huId, userName, employeeId } = dto;
    let message: string;
    switch (category) {
      case Category.RUS_CANCELED:
        message = `The hu3D task has been canceled, and 1 credit has been restored.`;
        break;
      case Category.CT_DELETED:
        message = `CT of ${huId} deleted.`;
        break;
      case Category.HU3D_DELETED:
        message = `hu3D of '${huId}' deleted.`;
        break;
      case Category.HU3D_COMPLETED:
        message = `hu3D of '${huId}' has been uploaded. Please check the model in RUS Client.`;
        break;
      case Category.HU3D_UPDATED:
        message = `hu3D of '${huId}' has been re-uploaded. Please recheck the model in RUS Client.`;
        break;
      case Category.STORAGE_SPACE_SHORTAGE:
        message = "The storage space is less than 10GB. Please delete the file.";
        break;
      case Category.CREDIT_SHORTAGE:
        message = `You have ${credits} ${credits > 1 ? "credits" : "credit"} left. Please request credit allocation from the responsible distributor.`;
        break;
      case Category.NEW_APPLICATION:
        message = `The approval request for ${userName} (${employeeId}) has been submitted.`;
        break;
      case Category.CREDIT_ALLOCATED:
        message = `${credits} credits allocated.`;
        break;
      case Category.CREDIT_REVOKED:
        message = `${credits} credits revoked.`;
        break;
      default:
        throw new HttpException(HutomHttpException.CREATE_DATA_ERROR, HutomHttpException.CREATE_DATA_ERROR.statusCode);
    }
    await this.insert({ category, userId, message });
  }
}
