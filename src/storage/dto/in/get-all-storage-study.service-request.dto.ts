import { IsIn } from "class-validator";
import { OrderQuery, StudyStorageSortQuery } from "@src/common/constant/enum.constant";

export class GetAllStorageStudyServiceReq {
  @IsIn(Object.values(StudyStorageSortQuery))
  sort: string;

  @IsIn(Object.values(OrderQuery))
  order: string;

  page: number;

  limit: number;

  huId?: string;

  patientId?: string;

  patientName?: string;

  startDeliveryDate?: string;

  endDeliveryDate?: string;
}
