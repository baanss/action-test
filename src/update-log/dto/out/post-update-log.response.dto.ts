import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class PostUpdateLogRes {
  @ApiProperty({ description: "생성된 UpdateLog DB id" })
  @IsNumber()
  id: number;
}
