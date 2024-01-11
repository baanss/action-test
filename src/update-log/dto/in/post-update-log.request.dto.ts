import { ApiProperty } from "@nestjs/swagger";

export class PostUpdateLogReq {
  @ApiProperty({ description: "업데이트로그 파일(확장자: .txt)", type: "string", format: "binary" })
  file: any;
}
