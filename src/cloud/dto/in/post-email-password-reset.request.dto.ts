import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PostEmailPasswordResetReq {
  @ApiProperty({ description: "서버코드 (01011ug)" })
  @IsString()
  serverCode: string;

  @ApiProperty({ description: "타겟 이메일" })
  @IsString()
  targetEmail: string;

  @ApiProperty({ description: "이메일 버튼 클릭시 이동할 수 있는 h-Server url" })
  @IsString()
  redirectUrl: string;
}
