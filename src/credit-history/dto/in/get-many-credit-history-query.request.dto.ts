import * as moment from "moment";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsISO8601, IsOptional, IsString, Min } from "class-validator";
import { escapeSpecialChars } from "@src/util/transformer.util";

export enum CreditHistoryCategoryQuery {
  /** ALL */
  ALL = "all",
  /** RUS Use */
  RUS_USE = "rus-use",
  /** RUS Cancel */
  RUS_CANCEL = "rus-cancel",
  /** Allocate */
  ALLOCATE = "allocate",
  /** Revoke */
  REVOKE = "revoke",
  /** NULL */
  NULL = "",
}

export enum CreditHistorySortQuery {
  CREATED_AT_ASC = "+createdAt",
  CREATED_AT_DESC = "-createdAt",
}

export class GetManyCreditHistoryQueryReq {
  @Transform(({ value }) => Number(value))
  @IsOptional()
  @Min(1)
  @ApiProperty({ description: "보여줄 페이지(최소값: 1)", required: false, default: 1, minimum: 1 })
  page?: number;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @Min(-1)
  @ApiProperty({ description: "한 페이지에 보여줄 항목 개수 (모든 항목 조회 옵션: -1)", required: false, default: 20, minimum: -1 })
  limit?: number;

  @Transform(({ value }) => value.split(","))
  @IsIn(Object.values(CreditHistoryCategoryQuery), { each: true })
  @IsOptional()
  @ApiProperty({
    description: "필터링할 크레딧 내역의 종류들 (구분자: 콤마)",
    required: false,
    type: String,
    example: Object.values(CreditHistoryCategoryQuery).toString(),
    default: CreditHistoryCategoryQuery.ALL,
  })
  categories?: CreditHistoryCategoryQuery[];

  @IsString()
  @IsOptional()
  @ApiProperty({ description: "검색할 크레딧 내역의 employeeId", required: false })
  @Transform(({ value }) => escapeSpecialChars(value))
  employeeId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: "검색할 크레딧 내역의 name", required: false })
  @Transform(({ value }) => escapeSpecialChars(value))
  name?: string;

  @IsISO8601()
  @IsOptional()
  @ApiProperty({
    description: "크레딧 내역 필터링 시작일",
    type: "(ISO)String",
    required: false,
    example: moment("2022-10-01", "YYYY-MM-DD").toISOString(),
  })
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  @ApiProperty({
    description: "크레딧 내역 필터링 종료일",
    type: "(ISO)String",
    required: false,
    example: moment("2023-11-01", "YYYY-MM-DD").toISOString(),
  })
  endDate?: string;

  @IsIn(Object.values(CreditHistorySortQuery))
  @IsOptional()
  @ApiProperty({ description: "정렬 방식", required: false, default: CreditHistorySortQuery.CREATED_AT_DESC, enum: CreditHistorySortQuery })
  sort?: string;
}
