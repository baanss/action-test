import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PatchUsersMyPasswordDto {
  @ApiProperty({ description: "현재 비밀번호" })
  @IsString()
  @IsNotEmpty()
  current: string;

  @ApiProperty({ description: "변경할 비밀번호" })
  @IsString()
  @IsNotEmpty()
  new: string;
}
