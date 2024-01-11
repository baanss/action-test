import { ArrayMaxSize, IsArray, IsBoolean, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RecipientReq } from "@src/recipient/dto";

export class PostRecipientsReq {
  @IsBoolean()
  @ApiProperty({ description: "메일 알람 활성화 여부", type: Boolean })
  enableEmail: boolean;

  @ApiProperty({ description: "생성 및 수정할 recipient의 전체 데이터 배열 (최대 9개)", type: RecipientReq, isArray: true, maximum: 9 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9, { message: "Recipient 데이터는 9개를 초과하여 입력할 수 없습니다." })
  recipients?: RecipientReq[];
}
