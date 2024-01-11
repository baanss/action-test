import * as moment from "moment";
import { Transform } from "class-transformer";
import { IsIn, IsISO8601, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OrderQuery, StudySortQuery } from "@src/common/constant/enum.constant";
import { escapeSpecialChars } from "@src/util/transformer.util";

export class GetAllStudyReq {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: "Patient ID", required: false })
  patientId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "Patient Name", required: false })
  patientName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "huID", required: false })
  @Transform(({ value }) => escapeSpecialChars(value))
  huId?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.endStudyDate ? true : false))
  @ApiProperty({
    description: "StudyDate 시작일(조건: endStudyDate 필수)",
    type: "(ISO)String",
    required: false,
    example: moment("2000-01-01", "YYYY-MM-DD").toISOString(),
  })
  startStudyDate?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.startStudyDate ? true : false))
  @ApiProperty({
    description: "StudyDate 종료일(조건: startStudyDate 필수)",
    type: "(ISO)String",
    required: false,
    example: moment("2099-01-01", "YYYY-MM-DD").toISOString(),
  })
  endStudyDate?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.endCreatedAt ? true : false))
  @ApiProperty({
    description: "CreatedAt 시작일(조건: endCreatedAt 필수)",
    type: "(ISO)String",
    required: false,
    example: moment("2000-01-01", "YYYY-MM-DD").toISOString(),
  })
  startCreatedAt?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.startCreatedAt ? true : false))
  @ApiProperty({
    description: "CreatedAt 종료일(조건: startCreatedAt 필수)",
    type: "(ISO)String",
    required: false,
    example: moment("2099-01-01", "YYYY-MM-DD").toISOString(),
  })
  endCreatedAt?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  @ApiProperty({ description: "보여줄 페이지(최소값: 1)", required: false, default: 1, minimum: 1 })
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  @ApiProperty({ description: "한 페이지에 보여줄 항목 개수(최소값: 1)", required: false, default: 20, minimum: 1 })
  limit?: number;

  @IsOptional()
  @IsIn(Object.values(StudySortQuery))
  @ApiProperty({ description: "정렬 대상", required: false, default: StudySortQuery.CREATED_AT, enum: StudySortQuery })
  sort?: string;

  @IsOptional()
  @IsIn(Object.values(OrderQuery))
  @ApiProperty({ description: "정렬 방식", required: false, default: OrderQuery.DESC, enum: OrderQuery })
  order?: string;
}
