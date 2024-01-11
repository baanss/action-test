import { IsArray, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { SurgeonDto } from "@src/surgeon/dto/surgeon.dto";

export class GetAllSurgeonRes {
  @ApiProperty({ description: "조회된 Surgeon 개수" })
  @IsNumber()
  count: number;

  @ApiProperty({ description: "조회된 Surgeon 목록", isArray: true, type: SurgeonDto })
  @IsArray()
  data: SurgeonDto[];
}
