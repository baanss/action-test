import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsString } from "class-validator";

export class PostEmailApplicationRejectReq {
  @ApiProperty({ description: "서버코드 (01011ug)" })
  @IsString()
  serverCode: string;

  @ApiProperty({ description: "타겟 이메일 배열 (1개 이상 가능)" })
  @IsArray()
  @ArrayNotEmpty()
  targetEmails: string[];
}
