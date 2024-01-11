import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber } from "class-validator";
import { RusAppDetailDto } from "@src/rus-app/dto/rus-app-detail.dto";

export class GetAllRusAppRusCaseRes {
  @ApiProperty({ description: "조회된 케이스 개수" })
  @IsNumber()
  count: number;

  @ApiProperty({ description: "조회된 케이스 목록", isArray: true, type: RusAppDetailDto })
  @IsArray()
  rusCases: RusAppDetailDto[];
}
