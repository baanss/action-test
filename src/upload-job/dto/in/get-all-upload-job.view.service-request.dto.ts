import { Transform } from "class-transformer";
import { IsIn } from "class-validator";
import { OrderQuery, UploadJobSortQuery } from "@src/common/constant/enum.constant";
import { escapeSpecialChars } from "@src/util/transformer.util";

export class GetAllUploadJobViewServiceReq {
  @Transform(({ value }) => Number(value))
  page: number;

  @Transform(({ value }) => Number(value))
  limit: number;

  @IsIn(Object.values(UploadJobSortQuery))
  sort: string;

  @IsIn(Object.values(OrderQuery))
  order: string;

  @Transform(({ value }) => escapeSpecialChars(value))
  userName: string | null;

  patientId?: string;

  patientName?: string;

  startStudyDate?: string;

  endStudyDate?: string;

  startCreatedAt?: string;

  endCreatedAt?: string;
}
