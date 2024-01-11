import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, Min } from "class-validator";

export class GetMyCreditHistoryQueryReq {
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
}
