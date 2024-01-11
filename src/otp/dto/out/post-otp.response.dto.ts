import { ApiProperty } from "@nestjs/swagger";

export class PostOtpRes {
  @ApiProperty({ description: "otp의 DB id" })
  id: number;
}
