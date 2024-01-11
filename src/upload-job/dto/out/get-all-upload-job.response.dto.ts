import { IsArray, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UploadJobViewDto } from "@src/upload-job/dto/upload-job.view.dto";

export class GetAllUploadJobRes {
  @ApiProperty({ description: "조회된 UploadJob 개수" })
  @IsNumber()
  count: number;

  @ApiProperty({ description: "조회된 UploadJob 목록", isArray: true, type: UploadJobViewDto })
  @IsArray()
  data: UploadJobViewDto[];
}
