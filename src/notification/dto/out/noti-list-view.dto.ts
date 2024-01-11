import { Exclude, Expose, plainToInstance } from "class-transformer";
import { Category, Notification } from "@src/common/entity/notification.entity";

@Exclude()
export class NotiListView {
  @Expose()
  id: number;

  @Expose()
  category: Category;

  @Expose()
  message: string;

  @Expose()
  read: boolean;

  @Expose()
  createdAt: string;

  static from(notifications: Notification[]) {
    return plainToInstance(NotiListView, notifications);
  }
}
