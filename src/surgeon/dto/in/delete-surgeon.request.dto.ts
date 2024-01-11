import { ArrayNotEmpty, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteSurgeonBodyReq {
  @ApiProperty({ description: "Surgeon의 DB id", required: true, isArray: true, type: Number })
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  ids: number[];
}
