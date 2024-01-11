import { Transform } from "class-transformer";
import { IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetAllApplicationQueryReq {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: "검색할 일반 사용자의 h-Server ID", required: false })
  employeeId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "검색할 일반 사용자의 이름", required: false })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: "불러올 데이터의 페이지 번호", required: false, default: 1, minimum: 1 })
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: "불러올 데이터의 개수", required: false, default: 20, minimum: -1 })
  @Min(-1)
  limit?: number;
}
