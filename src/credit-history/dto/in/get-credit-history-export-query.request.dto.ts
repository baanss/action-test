import * as moment from "moment";
import { IsIn, IsISO8601, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { CreditHistoryCategoryQuery } from "@src/credit-history/dto/in/get-many-credit-history-query.request.dto";
import { escapeSpecialChars } from "@src/util/transformer.util";

export class GetCreditHistoryExportQueryReq {
  @ApiProperty({ description: "출력할 크레딧 내역의 검색어 - employeeId", required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => escapeSpecialChars(value))
  employeeId?: string;

  @ApiProperty({ description: "출력할 크레딧 내역의 검색어 - name", required: false })
  @IsString()
  @Transform(({ value }) => escapeSpecialChars(value))
  @IsOptional()
  name?: string;

  @Transform(({ value }) => value.split(","))
  @IsIn(Object.values(CreditHistoryCategoryQuery), { each: true })
  @IsOptional()
  @ApiProperty({
    description: "출력할 크레딧 내역의 종류들 (구분자: 콤마)",
    required: false,
    type: String,
    example: Object.values(CreditHistoryCategoryQuery).toString(),
    default: CreditHistoryCategoryQuery.ALL,
  })
  categories?: CreditHistoryCategoryQuery[];

  @ApiProperty({ description: "출력할 크레딧 내역 생성일 시작 날짜", example: moment("2000-01-01", "YYYY-MM-DD").toISOString() })
  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: "출력할 크레딧 내역 생성일 마지막 날짜", example: moment("2099-01-01", "YYYY-MM-DD").toISOString() })
  @IsISO8601()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: "사용자의 로컬 타임존", default: "UTC" })
  @IsString()
  @IsOptional()
  timezone?: string;
}
