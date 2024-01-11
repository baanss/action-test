import { Transform } from "class-transformer";
import { IsOptional, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetAllSurgeonQueryReq {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: "보여줄 페이지(최소값: 1)", required: false, default: 1, minimum: 1 })
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: "한 페이지에 보여줄 항목 개수(최소값: -1)", required: false, default: 20, minimum: -1 })
  @Min(-1)
  limit?: number;
}
