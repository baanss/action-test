import { IsIn, IsNumber, IsString } from "class-validator";
import { CreditHistoryCategoryQuery, CreditHistorySortQuery } from "@src/credit-history/dto/in/get-many-credit-history-query.request.dto";

export class GetManyCreditHistoryBalanceViewServiceReq {
  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsIn(Object.values(CreditHistoryCategoryQuery), { each: true })
  categories?: string[];

  @IsString()
  employeeId?: string;

  @IsString()
  name?: string;

  @IsString()
  startDate?: string;

  @IsString()
  endDate?: string;

  @IsIn(Object.values(CreditHistorySortQuery))
  sort?: string;
}
