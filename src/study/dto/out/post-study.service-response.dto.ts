import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateStudyFileInfo {
  @IsString()
  filePath: string;

  @IsNumber()
  seriesCount: number;

  @IsNumber()
  instancesCount: number;
}

export class CreateStudyPatientInfo {
  @IsString()
  huId: string;

  @IsString()
  patientId: string;

  @IsString()
  patientName: string;

  @IsString()
  studyDate: string;

  @IsString()
  studyTime: string;

  @IsString()
  studyDescription: string;

  @IsString()
  @IsOptional()
  age?: string;

  @IsString()
  @IsOptional()
  sex?: string;
}
