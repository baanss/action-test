import { Transform } from "class-transformer";
import { IsISO8601, IsIn, IsNumber, IsString } from "class-validator";
import { OrderQuery, UploadJobSortQuery } from "@src/common/constant/enum.constant";

export class GetAllUploadJobViewRepositoryReq {
  @IsNumber()
  @Transform(({ value }) => Number(value))
  page: number;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit: number;

  @IsIn(Object.values(UploadJobSortQuery))
  sort: string;

  @IsIn(Object.values(OrderQuery))
  order: string;

  @IsString()
  userName: string | null;

  patientId?: string;

  patientName?: string;

  @IsISO8601()
  startStudyDate?: string;

  @IsISO8601()
  endStudyDate?: string;

  @IsISO8601()
  startCreatedAt?: string;

  @IsISO8601()
  endCreatedAt?: string;

  isDicomFileNotDeleted?: boolean;

  studyInstanceUID?: string;
}
