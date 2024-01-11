import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class PostRusCaseHu3dRes {
  @ApiProperty({ description: "수정된 케이스 DB id" })
  @IsNumber()
  id: number;
}
