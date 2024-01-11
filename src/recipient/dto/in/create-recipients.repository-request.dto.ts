import { IsBoolean, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRecipientsRepositoryReq {
  @IsString()
  @ApiProperty({ description: "메일 알림을 받을 이메일 주소" })
  email: string;

  @ApiProperty({ description: "메일 알림 Default 설정 여부", default: false })
  @IsBoolean()
  isDefault: boolean;
}
