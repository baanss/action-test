import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, Min } from "class-validator";

export class GetMyNotiQuery {
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @ApiProperty({ description: "보여줄 페이지", required: false, default: 1, minimum: 1 })
  page?: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  @Min(-1)
  @ApiProperty({ description: "한 페이지에 보여줄 항목 개수", required: false, default: 6, minimum: -1 })
  limit?: number;
}
