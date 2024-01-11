import { ApiProperty } from "@nestjs/swagger";
import { StudyDto } from "@src/study/dto/study.dto";
import { IsArray, IsString } from "class-validator";

export class GetAllStudyRes {
  @ApiProperty({ description: "조회된 스터디 개수" })
  @IsString()
  count: number;

  @ApiProperty({ description: "조회된 스터디 목록", isArray: true, type: StudyDto })
  @IsArray()
  studies: StudyDto[];
}
