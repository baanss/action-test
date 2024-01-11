import { ApiProperty } from "@nestjs/swagger";

export class DeleteApplicationRes {
  @ApiProperty({ description: "거절 처리된 가입신청서 수" })
  affected: number;
}
