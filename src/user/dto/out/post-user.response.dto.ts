import { ApiProperty } from "@nestjs/swagger";

export class PostUserRes {
  @ApiProperty({ description: "생성된 사용자의 DB 아이디" })
  id: number;
}
