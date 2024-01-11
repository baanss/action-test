import * as moment from "moment";
import { Transform } from "class-transformer";
import { IsIn, IsISO8601, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OrderQuery, RusCaseSortQuery } from "@src/common/constant/enum.constant";
import { escapeSpecialChars } from "@src/util/transformer.util";

export class GetAllRusCaseReq {
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
  @ApiProperty({ description: "huID", required: false })
  @Transform(({ value }) => escapeSpecialChars(value))
  huId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "rusCase 생성 계정 이름", required: false })
  userName?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: "DeliveryDate 시작일",
    type: "(ISO)String",
    required: false,
    example: moment("2000-01-01", "YYYY-MM-DD").toISOString(),
  })
  startDeliveryDate?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({
    description: "DeliveryDate 종료일",
    type: "(ISO)String",
    required: false,
    example: moment("2099-01-01", "YYYY-MM-DD").toISOString(),
  })
  endDeliveryDate?: string;

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
  @IsIn(Object.values(RusCaseSortQuery))
  @ApiProperty({ description: "정렬 대상", required: false, default: RusCaseSortQuery.CREATED_AT, enum: RusCaseSortQuery })
  sort?: string;

  @IsOptional()
  @IsIn(Object.values(OrderQuery))
  @ApiProperty({ description: "정렬 방식", required: false, default: OrderQuery.DESC, enum: OrderQuery })
  order?: string;
}
