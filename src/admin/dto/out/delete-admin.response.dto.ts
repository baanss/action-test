import { ApiProperty } from "@nestjs/swagger";

export class DeleteAdminRes {
  @ApiProperty({ description: "삭제된 대표 계정의 수" })
  affected: number;
}
