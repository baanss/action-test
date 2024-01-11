import { IsIn } from "class-validator";
import { RusCaseStatus } from "@src/common/constant/enum.constant";

export class PatchRusCaseServiceReq {
  @IsIn([RusCaseStatus])
  status?: string;

  operationDate?: string;

  deliveryDate?: string;
}
