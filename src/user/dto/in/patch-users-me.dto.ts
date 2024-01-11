import { IsBoolean, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PatchUsersMeDto {
  @ApiProperty({ description: "변경할 이메일", required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: "변경할 이름", required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: "변경할 전화번호", required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: "유저 가이드 표시 여부", required: false })
  @IsBoolean()
  @IsOptional()
  showGuide?: boolean;

  @ApiProperty({ description: "비밀번호 설정(혹은 재설정) 시점", required: false })
  @IsString()
  @IsOptional()
  passwordSettingAt?: string;
}
