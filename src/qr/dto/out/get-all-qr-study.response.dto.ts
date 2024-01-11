import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsString } from "class-validator";
import { QrStudyDto } from "@src/qr/dto/qr-study.dto";

export class GetAllQrStudyRes {
  @ApiProperty({
    example: "스터디 검색 성공",
    description: "메시지",
  })
  @IsString()
  readonly message: string;

  @ApiProperty({ description: "조회된 Study 개수" })
  @IsNumber()
  readonly count: number;

  @ApiProperty({
    description: "조회된 Study 목록",
    isArray: true,
    type: QrStudyDto,
  })
  @IsArray()
  readonly data: QrStudyDto[];
}
