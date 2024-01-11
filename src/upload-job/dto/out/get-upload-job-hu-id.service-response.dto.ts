import { ApiProperty } from "@nestjs/swagger";

export class GetUploadJobHuIdServiceRes {
  @ApiProperty({ description: "huId" })
  huId: string;

  @ApiProperty({ description: "instance 파일 개수", nullable: true })
  instancesCount: number;

  @ApiProperty({ description: "affected rows count" })
  affected: number;
}
