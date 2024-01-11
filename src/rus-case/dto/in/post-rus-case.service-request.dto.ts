import { IsBoolean, IsISO8601, IsNumber, IsString } from "class-validator";

export class PostRusCaseServiceReq {
  @IsNumber()
  userId: number;

  @IsNumber()
  studyId: number;

  @IsString()
  patientName: string;

  @IsString()
  operationType: string;

  @IsISO8601()
  deliveryDate: string;

  @IsISO8601()
  operationDate: string;

  @IsNumber()
  age: number;

  @IsString()
  sex: string;

  @IsNumber()
  height: number;

  @IsNumber()
  weight: number;

  @IsBoolean()
  childbirth: boolean;

  @IsString()
  memo?: string;

  @IsString()
  remark?: string;

  @IsNumber()
  surgeonId?: number;
}
