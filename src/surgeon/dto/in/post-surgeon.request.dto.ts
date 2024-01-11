import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PostSurgeonReq {
  @ApiProperty({ description: "Surgeon 이름" })
  @IsString()
  name: string;
}
