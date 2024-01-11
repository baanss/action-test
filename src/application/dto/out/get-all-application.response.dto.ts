import { IsArray, IsNumber, IsObject } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { GetApplicationDto } from "@src/application/dto";

export class GetAllApplicationRes {
  @ApiProperty({ description: "가입 신청서 배열", isArray: true, type: GetApplicationDto })
  @IsArray()
  @IsObject({ each: true })
  data: GetApplicationDto[];

  @ApiProperty({ description: "조회된 가입 신청서 개수" })
  @IsNumber()
  count: number;
}
