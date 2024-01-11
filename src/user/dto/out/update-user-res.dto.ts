import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserRes {
  @ApiProperty({ description: "처리된 사용자의 DB 아이디" })
  id: number;
}
