import { IsNumber } from "class-validator";

export class GetMyCreditHistoryBalanceViewServiceReq {
  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;
}
