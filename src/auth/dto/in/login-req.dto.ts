import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UserLoginReq {
  @ApiProperty({ description: "사용자 회원 아이디", example: "doctor1" })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: "사용자 비밀번호", example: "change_this!" })
  @IsString()
  password: string;

  @ApiProperty({ description: "강제 로그인 실행 여부 (Optional. user, admin only)", default: false })
  @IsOptional()
  isForced: boolean;
}

export class AppLoginReq {
  @ApiProperty({ description: "사용자 회원 아이디", example: "doctor1" })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: "사용자 비밀번호", example: "change_this!" })
  @IsString()
  password: string;
}
