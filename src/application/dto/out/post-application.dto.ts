import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class PostApplicationDto {
  @ApiProperty({ description: "생성된 가입 신청서의 DB id" })
  @IsNumber()
  id: number;
}
