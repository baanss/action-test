import { ApiProperty } from "@nestjs/swagger";

export class GetUploadJobHuIdRes {
  @ApiProperty({ description: "huId" })
  huId: string;

  @ApiProperty({ description: "affected rows count" })
  affected: number;
}
