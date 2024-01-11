import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsNumber } from "class-validator";

export class PostApplicationRejectReq {
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @ApiProperty({ description: "거절할 가입신청서 id의 배열", type: Number, isArray: true })
  ids: number[];
}
