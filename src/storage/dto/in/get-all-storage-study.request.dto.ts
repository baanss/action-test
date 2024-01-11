import * as moment from "moment";
import { Transform } from "class-transformer";
import { IsIn, IsISO8601, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OrderQuery, StudyStorageSortQuery } from "@src/common/constant/enum.constant";
import { escapeSpecialChars } from "@src/util/transformer.util";

export class GetAllStorageStudyReq {
  @ApiProperty({ description: "검색할 study의 huID", required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => escapeSpecialChars(value))
  huId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "Patient ID(암호화 모드: 완전 일치 검색, 복호화 모드: 부분 일치 검색)", required: false })
  patientId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "Patient Name(암호화 모드: 완전 일치 검색, 복호화 모드: 부분 일치 검색)", required: false })
  patientName?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: "StudyDate 시작일",
    type: "(ISO)String",
    required: false,
    example: moment("2000-01-01", "YYYY-MM-DD").toISOString(),
  })
  startDeliveryDate?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: "StudyDate 종료일",
    type: "(ISO)String",
    required: false,
    example: moment("2099-01-01", "YYYY-MM-DD").toISOString(),
  })
  endDeliveryDate?: string;

  @ApiProperty({ description: "보여줄 페이지(최소값: 1)", default: "1", minimum: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  page?: number;

  @ApiProperty({ description: "한 페이지에서 보여줄 항목 개수(최소값: 1)", default: "20", minimum: -1, required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(-1)
  limit?: number;

  @ApiProperty({ description: "정렬 대상", required: false, default: StudyStorageSortQuery.CREATED_AT, enum: StudyStorageSortQuery })
  @IsOptional()
  @IsIn(Object.values(StudyStorageSortQuery))
  sort?: string;

  @ApiProperty({ description: "정렬 방식", required: false, default: OrderQuery.DESC, enum: OrderQuery })
  @IsOptional()
  @IsIn(Object.values(OrderQuery))
  order?: string;
}
