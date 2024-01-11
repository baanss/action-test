import { IsArray, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { StorageStudyDto } from "@src/storage/dto/storage-study.dto";

export class GetAllStorageStudyRes {
  @ApiProperty({ description: "조회 결과 개수" })
  @IsNumber()
  count: number;

  @ApiProperty({ description: "조회 결과 목록", isArray: true, type: StorageStudyDto })
  @IsArray()
  data: StorageStudyDto[];
}
