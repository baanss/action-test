import { IsArray, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RecipientReq } from "@src/recipient/dto/in/recipient-request.dto";

export class PostRecipientsServiceReq {
  @IsBoolean()
  @ApiProperty({ description: "메일 알람 활성화 여부", type: Boolean })
  enableEmail: boolean;

  @ApiProperty({ description: "생성 및 수정할 recipient의 전체 데이터 배열", type: RecipientReq, isArray: true })
  @IsArray()
  recipients: RecipientReq[] | null;
}
