import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber } from "class-validator";

export class PostRusCaseRes {
  @ApiProperty({ description: "생성된 RusCase의 DB id" })
  @IsNumber()
  id: number;

  @ApiProperty({ description: "h-Space 전송 완료 여부" })
  @IsBoolean()
  isCompleted: boolean;
}
