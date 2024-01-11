import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PostQrStudyReq {
  @IsString()
  @ApiProperty({
    example: "1.2.840.200108.2.638071253450950448",
    description: "StudyInstanceUID",
  })
  studyInstanceUID: string;

  @ApiProperty({ description: "Patient ID", example: "501" })
  @IsString()
  patientId: string;

  @ApiProperty({ description: "Patient Name", nullable: true })
  @IsOptional()
  @IsString()
  patientName: string | null;

  @ApiProperty({ description: "요청 파일 개수", nullable: true })
  @IsOptional()
  @IsNumber()
  instancesCount: number | null;

  @ApiProperty({ description: "Patient Age", example: "063Y", nullable: true })
  @IsOptional()
  @IsString()
  age: string | null;

  @ApiProperty({ description: "Patient Sex", nullable: true })
  @IsString()
  @IsOptional()
  sex: string | null;
}
