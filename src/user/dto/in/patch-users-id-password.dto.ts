import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PatchUsersIdPasswordDto {
  @ApiProperty({ description: "이메일로 전달받은 일회용 비밀번호 토큰" })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: "변경할 비밀번호" })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
