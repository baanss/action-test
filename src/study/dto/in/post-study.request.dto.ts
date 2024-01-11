import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class PostStudyReq {
  @ApiProperty({ description: "파일 경로" })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({ description: "huID" })
  @IsString()
  @IsNotEmpty()
  huId: string;

  @ApiProperty({ description: "시리즈(하위 폴더) 수" })
  @IsNumber()
  seriesCount: number;

  @ApiProperty({ description: "인스턴스(파일) 수" })
  @IsNumber()
  instancesCount: number;

  @ApiProperty({ description: "환자 ID", nullable: true })
  @IsString()
  @IsOptional()
  patientId: string;

  @ApiProperty({ description: "Study Date", nullable: true })
  @IsString()
  @IsOptional()
  studyDate: string;

  @ApiProperty({ description: "환자 이름", nullable: true })
  @IsString()
  @IsOptional()
  patientName: string;

  @ApiProperty({ description: "Study Time", nullable: true })
  @IsOptional()
  @IsString()
  studyTime: string;

  @ApiProperty({ description: "Study Description", nullable: true })
  @IsOptional()
  @IsString()
  studyDescription: string;

  @ApiProperty({ description: "환자 나이", nullable: true })
  @IsOptional()
  @IsString()
  age: string;

  @ApiProperty({ description: "환자 성별", nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1)
  sex: string;
}
