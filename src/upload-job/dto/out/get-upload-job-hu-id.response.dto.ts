import { ApiProperty } from "@nestjs/swagger";

export class GetUploadJobHuIdRes {
  @ApiProperty({ description: "huId" })
  huId: string;

  @ApiProperty({ description: "instance 파일 개수", nullable: true })
  instancesCount: number | null;

  @ApiProperty({ description: "affected rows count" })
  affected: number;
}
