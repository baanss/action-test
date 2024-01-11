import * as moment from "moment";
import { IsISO8601, IsIn, IsOptional, IsString, Min } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { OrderQuery, UploadJobSortQuery } from "@src/common/constant/enum.constant";

export class GetAllUploadJobReq {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: "Patient ID(암호화 모드: 완전 일치 검색, 복호화 모드: 부분 일치 검색)", required: false })
  patientId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "Patient Name(암호화 모드: 완전 일치 검색, 복호화 모드: 부분 일치 검색)", required: false })
  patientName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "Study 요청 계정 이름", required: false })
  userName?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: "StudyDate 시작일",
    type: "(ISO)String",
    required: false,
    example: moment("2000-01-01", "YYYY-MM-DD").toISOString(),
  })
  startStudyDate?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: "StudyDate 종료일",
    type: "(ISO)String",
    required: false,
    example: moment("2099-01-01", "YYYY-MM-DD").toISOString(),
  })
  endStudyDate?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: "CreatedAt 시작일",
    type: "(ISO)String",
    required: false,
    example: moment("2000-01-01", "YYYY-MM-DD").toISOString(),
  })
  startCreatedAt?: string;

  @IsOptional()
  @IsISO8601()
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
  @ApiProperty({ description: "보여줄 페이지", required: false, default: 1, minimum: 1 })
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(-1)
  @ApiProperty({ description: "한 페이지에 보여줄 항목 개수", required: false, default: 20, minimum: -1 })
  limit?: number;

  @IsOptional()
  @IsIn(Object.values(UploadJobSortQuery))
  @ApiProperty({ description: "정렬 대상", required: false, default: UploadJobSortQuery.CREATED_AT, enum: UploadJobSortQuery })
  sort?: string;

  @IsOptional()
  @IsIn(Object.values(OrderQuery))
  @ApiProperty({ description: "정렬 방식", required: false, default: OrderQuery.DESC, enum: OrderQuery })
  order?: string;
}
