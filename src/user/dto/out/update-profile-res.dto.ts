import { ApiProperty } from "@nestjs/swagger";

export class UpdateProfileRes {
  @ApiProperty({ description: "프로필 이미지 URL" })
  profileUrl: string;
}
