import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PostRusCaseHu3dReq {
  @ApiProperty({ description: "hu3D 파일(확장자: .hu3d)", type: "string", format: "binary" })
  file: any;
}

export class PostRusCaseHu3dQueryReq {
  @ApiProperty({ description: "huId" })
  @IsString()
  huId: string;
}
