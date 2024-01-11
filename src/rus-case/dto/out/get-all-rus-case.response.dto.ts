import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber } from "class-validator";
import { RusCaseDto } from "@src/rus-case/dto/rus-case.dto";

export class GetAllRusCaseRes {
  @ApiProperty({ description: "조회된 케이스 개수" })
  @IsNumber()
  count: number;

  @ApiProperty({ description: "조회된 케이스 목록", isArray: true, type: RusCaseDto })
  @IsArray()
  data: RusCaseDto[];
}
