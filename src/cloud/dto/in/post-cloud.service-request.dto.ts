import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PostCloudRejectServiceReq {
  @ApiProperty({ description: "케이스 huID" })
  @IsString()
  huId: string;

  @ApiProperty({ description: "사용자 이메일" })
  @IsString()
  email: string;
}
