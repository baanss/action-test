import { IsNumber, IsOptional, IsString } from "class-validator";

export class PostStudyServiceReq {
  uploadJobId: number;

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

  @IsNumber()
  @IsOptional()
  seriesCount?: number;

  @IsNumber()
  @IsOptional()
  instancesCount?: number;
}
