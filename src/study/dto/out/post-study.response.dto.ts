import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class PostStudyRes {
    @ApiProperty({ description: "생성된 스터디 DB id" })
    @IsNumber()
    id: number;
}
