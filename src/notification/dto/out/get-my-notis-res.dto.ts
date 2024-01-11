import { ApiProperty } from "@nestjs/swagger";
import { NotiListView } from "@src/notification/dto/out/noti-list-view.dto";

export class GetMyNotisRes {
  @ApiProperty({ description: "알림 리스트 배열" })
  data: NotiListView[];

  @ApiProperty({ description: "조회된 알림 개수" })
  count: number;
}
