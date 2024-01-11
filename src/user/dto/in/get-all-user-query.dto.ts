import { IsOptional, IsString, Min } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { escapeSpecialChars } from "@src/util/transformer.util";

export class GetAllUserQueryReq {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: "검색할 일반 사용자의 h-Server ID", required: false })
  @Transform(({ value }) => escapeSpecialChars(value))
  employeeId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: "검색할 일반 사용자의 이름", required: false })
  @Transform(({ value }) => escapeSpecialChars(value))
  name?: string;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @Min(1)
  @ApiProperty({ description: "보여줄 페이지(최소값: 1)", required: false, default: 1, minimum: 1 })
  page?: number;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @Min(-1)
  @ApiProperty({ description: "한 페이지에 보여줄 항목 개수(최소값: 1)", required: false, default: 20, minimum: 1 })
  limit?: number;
}
