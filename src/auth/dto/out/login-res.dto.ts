import { ApiProperty } from "@nestjs/swagger";

export class LoginRes {
  @ApiProperty({ description: "액세스 토큰" })
  accessToken: string;
}
