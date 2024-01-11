import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetCloudRes {
    @ApiProperty({ description: "메시지" })
    @IsString()
    message: string;
  }
