import { ApiProperty } from "@nestjs/swagger";

export class DeleteSurgeonRes {
  @ApiProperty({ description: "삭제 처리된 row 개수" })
  affected: number;
}
