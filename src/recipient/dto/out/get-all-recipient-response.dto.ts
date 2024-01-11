import { ApiProperty } from "@nestjs/swagger";
import { GetAllRecipientViewDto } from "@src/recipient/dto/out/get-all-recipient-view.dto";

export class GetAllRecipientRes {
  @ApiProperty({ description: "조회된 전체 Recipient 개수", type: Number })
  count: number;

  @ApiProperty({ description: "사용자의 email 주소", type: String })
  myEmail: string;

  @ApiProperty({ description: "Recipient 리스트", type: GetAllRecipientViewDto, isArray: true })
  data: GetAllRecipientViewDto[];
}
