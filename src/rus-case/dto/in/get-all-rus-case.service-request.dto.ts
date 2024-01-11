import { IsIn } from "class-validator";
import { OrderQuery, RusCaseSortQuery } from "@src/common/constant/enum.constant";

export class GetAllRusCaseServiceReq {
  patientId?: string;

  patientName?: string;

  huId?: string;

  userName?: string;

  startDeliveryDate?: string;

  endDeliveryDate?: string;

  page: number;

  limit: number;

  @IsIn(Object.values(RusCaseSortQuery))
  sort: string;

  @IsIn(Object.values(OrderQuery))
  order: string;
}
