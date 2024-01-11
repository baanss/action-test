import { ApiProperty } from "@nestjs/swagger";

export class PostStudyUploadFileReq {
  @ApiProperty({ description: "다이콤 파일(확장자: .zip)", type: "string", format: "binary" })
  file: any;
}
