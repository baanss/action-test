import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class DeleteAdminReq {
  @ApiProperty({ description: "삭제 대상 대표 계정 ID" })
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: "삭제 대상 대표 계정 이메일" })
  @IsString()
  @IsNotEmpty()
  email: string;
}
