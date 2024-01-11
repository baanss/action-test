import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";
import * as moment from "moment";

export class GetAllQrStudyReq {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: "501",
    description: "Patient ID",
    required: true,
  })
  patientId: string;

  @IsISO8601()
  @IsNotEmpty()
  @ApiProperty({
    example: moment().toISOString(),
    description: "오늘 날짜",
    required: true,
  })
  today: string; //2022-11-18T02:08:06.544Z

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsIn(["7", "30", "90"], {
    message: "기간 선택은 7일, 30일, 90일 만 가능합니다.",
  })
  @ApiProperty({
    example: null,
    enum: ["7", "30", "90"],
    default: null,
    description: "기간",
    required: false,
  })
  period: string; //기간
}
