import { ApiProperty } from "@nestjs/swagger";
import { MyCreditHistoryBalanceViewDto } from "@src/credit-history/dto/out//my-credit-history-balance.view.dto";

export class GetMyCreditHistoryRes {
  @ApiProperty({ description: "크레딧 내역 배열", type: MyCreditHistoryBalanceViewDto, isArray: true })
  data: MyCreditHistoryBalanceViewDto[];

  @ApiProperty({ description: "조회된 크레딧 내역 개수", type: Number })
  count: number;
}
