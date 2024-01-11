import { ApiProperty } from "@nestjs/swagger";

export class PostQrStudyRes {
  @ApiProperty({
    description: "upload-job DB id",
  })
  readonly id: number;
}
