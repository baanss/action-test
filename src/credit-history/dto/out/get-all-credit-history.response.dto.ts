import { ApiProperty } from "@nestjs/swagger";
import { CreditHistoryBalanceViewDto } from "@src/credit-history/dto/out/credit-history-balance.view.dto";

export class GetAllCreditHistoryRes {
  @ApiProperty({ description: "크레딧 내역 배열", type: CreditHistoryBalanceViewDto, isArray: true })
  data: CreditHistoryBalanceViewDto[];

  @ApiProperty({ description: "조회된 크레딧 내역 개수", type: Number })
  count: number;
}
