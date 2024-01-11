import { ApiProperty } from "@nestjs/swagger";

export class PostRecipientsResMeta {
  @ApiProperty({ description: "메일 알람 활성화 여부" })
  enableEmail: boolean;
}

export class PostRecipientsRes {
  @ApiProperty({ description: "생성 및 수정된 recipient의 DB id 배열", type: Number, isArray: true })
  ids: number[];

  @ApiProperty({ description: "조회된 전체 Recipient 개수" })
  meta: PostRecipientsResMeta;
}
