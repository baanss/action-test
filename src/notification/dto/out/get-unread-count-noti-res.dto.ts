import { ApiProperty } from "@nestjs/swagger";

export class GetUnreadCountNotiRes {
  @ApiProperty({ description: "읽지 않은 알림 개수" })
  unreadCount: number;
}
