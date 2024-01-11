import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PostAdminReq {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "대표 계정 h-Server ID" })
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "대표 계정 이메일" })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "대표 계정 사용자 이름" })
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "대표 계정 전화번호", required: false })
  phoneNumber?: string;
}
