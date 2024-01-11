import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class PostFeedbackRes {
  @ApiProperty({ description: "피드백 DB id" })
  @IsNumber()
  id: number;
}
