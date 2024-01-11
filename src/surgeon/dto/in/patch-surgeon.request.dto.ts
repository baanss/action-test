import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PatchSurgeonBodyReq {
  @ApiProperty({ description: "Surgeon 이름", required: true })
  @IsString()
  name: string;
}
