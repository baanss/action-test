import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PostOtpBodyReq {
  @ApiProperty({ description: "계정 ID" })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: "계정 email" })
  @IsString()
  email: string;
}
