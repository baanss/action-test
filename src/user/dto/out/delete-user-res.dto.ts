import { ApiProperty } from "@nestjs/swagger";

export class DeleteUserRes {
  @ApiProperty({ description: "처리된 사용자의 수" })
  affected: number;
}
