import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetOtpQueryReq {
  @ApiProperty({ description: "otp의 token" })
  @IsString()
  token: string;
}
