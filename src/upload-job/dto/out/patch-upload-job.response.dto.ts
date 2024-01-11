import { ApiProperty } from "@nestjs/swagger";

export class PatchUploadJobRes {
  @ApiProperty({ description: "upload-job DB id" })
  id: number;
}
