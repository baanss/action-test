import { ApiProperty } from "@nestjs/swagger";

export class PostInstallerReq {
  @ApiProperty({ description: "설치파일(확장자: .exe)", type: "string", format: "binary" })
  file: any;
}
