import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PostQrStudyServiceReq {
  @ApiProperty({ description: "user DB id" })
  @IsNumber()
  readonly userId: number;

  @ApiProperty({ description: "StudyInstanceUID" })
  @IsString()
  @IsNotEmpty()
  readonly studyInstanceUID: string;

  @ApiProperty({ description: "Patient ID" })
  @IsString()
  readonly patientId: string;

  @ApiProperty({ description: "Patient Name", default: null })
  @IsString()
  readonly patientName: string;

  @ApiProperty({ description: "요청 파일 개수", default: null })
  @IsNumber()
  readonly instancesCount: number;
}
