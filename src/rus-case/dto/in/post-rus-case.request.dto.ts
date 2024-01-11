import * as moment from "moment";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PostRusCaseReq {
  @IsNumber()
  @ApiProperty({ description: "스터디 DB id" })
  studyId: number;

  @IsString()
  @ApiProperty({ description: "Patient Name" })
  patientName: string;

  @IsString()
  @ApiProperty({ description: "수술 유형" })
  operationType: string;

  @IsString()
  @ApiProperty({ description: "hu3D 제작 완료일", example: moment(new Date()) })
  deliveryDate: string;

  @IsString()
  @ApiProperty({ description: "수술 날짜", example: moment(new Date()) })
  operationDate: string;

  @IsNumber()
  @ApiProperty({ description: "나이" })
  age: number;

  @IsString()
  @MaxLength(1)
  @ApiProperty({ description: "성별", enum: ["F", "M", "O"] })
  sex: string;

  @IsNumber()
  @ApiProperty({ description: "키" })
  height: number;

  @IsNumber()
  @ApiProperty({ description: "몸무게" })
  weight: number;

  @IsBoolean()
  @ApiProperty({ description: "출산여부" })
  childbirth: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "메모", required: false })
  memo?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: "메모(Cancer description)", required: false })
  remark?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: "수술 집도의(Surgeon)의 DB id", required: false })
  surgeonId?: number;

  @IsOptional()
  @IsArray()
  @ApiProperty({ description: "이메일 수신자(Recipient)의 DB id", isArray: true, required: false })
  recipientIds?: number[];
}
