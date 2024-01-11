import { Transform } from "class-transformer";
import { IsIn, IsISO8601, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { OrderQuery, StudySortQuery } from "@src/common/constant/enum.constant";

export class GetAllStudyRepositoryReq {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  huId?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.endStudyDate ? true : false))
  startStudyDate?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.startStudyDate ? true : false))
  endStudyDate?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.endCreatedAt ? true : false))
  startCreatedAt?: string;

  @IsISO8601()
  @ValidateIf((o) => (o?.startCreatedAt ? true : false))
  endCreatedAt?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsIn(Object.values(StudySortQuery))
  sort?: string;

  @IsOptional()
  @IsIn(Object.values(OrderQuery))
  order?: string;
}
