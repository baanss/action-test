import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class PostStudyUploadFileRes {
  @ApiProperty({ description: "스터디 DB id" })
  @IsNumber()
  id: number;
}
