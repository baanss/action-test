import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsNumber, IsString } from "class-validator";

export class DeleteManyDto {
  @ApiProperty({ description: "삭제할 사용자의 DB 아이디", type: Number, isArray: true })
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  ids: number[];

  @ApiProperty({ description: "어드민/매니저 비밀번호" })
  @IsString()
  password: string;
}
