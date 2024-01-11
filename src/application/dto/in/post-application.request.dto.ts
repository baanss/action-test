import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateApplicationReq {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "가입 신청 대상 h-Server 사용자 ID" })
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "가입 신청 대상 계정의 email" })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "가입 신청 대상 사용자의 이름" })
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: "가입 신청 대상 사용자의 전화번호", required: false })
  phoneNumber?: string;
}
