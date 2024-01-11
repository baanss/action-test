import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@src/auth/interface/auth.interface";

export class AuthRes {
  @ApiProperty({ description: "사용자 DB 아이디" })
  id: number;

  @ApiProperty({ description: "사용자 회원 아이디" })
  employeeId: string;

  @ApiProperty({ description: "사용자 역할", enum: Role, enumName: "Role" })
  role: Role;

  @ApiProperty({ description: "토큰 만료까지 남은 시간(N초 이후 만료)" })
  expiresIn: number;

  @ApiProperty({ description: "유저 가이드 표시 여부" })
  showGuide: boolean;

  @ApiProperty({ description: "비밀번호 설정(혹은 변경) 시각" })
  passwordSettingAt: string;

  @ApiProperty({ description: "메일 알람 활성화 여부" })
  enableEmail: boolean;
}
