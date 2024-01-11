import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber } from "class-validator";

export class PostAdminRes {
  @ApiProperty({ description: "생성(승격)된 대표 계정의 사용자 DB id" })
  @IsNumber()
  id: number;

  @ApiProperty({ description: "생성 여부 (false : 승격)" })
  @IsBoolean()
  isCreated: boolean;
}
