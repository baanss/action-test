import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, plainToInstance } from "class-transformer";

import { BalanceView } from "@src/common/entity/balance.view.entity";
import { User } from "@src/common/entity/user.entity";

export enum MyCreditHistoryRequestedBy {
  ME = "me",
  OTHERS = "others",
  HUTOM = "hutom",
}

@Exclude()
export class MyCreditHistoryBalanceViewDto {
  @Expose()
  @ApiProperty({ description: "Credit History DB ID" })
  id: number;

  @Expose()
  @ApiProperty({ description: "Credit History 카테고리" })
  category: string;

  @Expose()
  @ApiProperty({ description: "Credit 변동량 (절대값)" })
  quantity: number;

  @Expose()
  @ApiProperty({ description: "Credit 잔액" })
  balance: number;

  @Expose()
  @ApiProperty({ description: "요청한 사용자의 분류", enum: MyCreditHistoryRequestedBy })
  requestedBy: string;

  @Expose()
  @ApiProperty({ description: "Credit History 생성일자" })
  createdAt: string;

  static fromMany(requestor: User, balanceViews: BalanceView[]): MyCreditHistoryBalanceViewDto[] {
    return balanceViews.map((balanceView) => {
      const myCreditHistoryBalanceViewDto = plainToInstance(MyCreditHistoryBalanceViewDto, balanceView);

      myCreditHistoryBalanceViewDto.id = balanceView.id;
      myCreditHistoryBalanceViewDto.category = balanceView.category;
      myCreditHistoryBalanceViewDto.quantity = Math.abs(balanceView.quantity);
      myCreditHistoryBalanceViewDto.balance = Number(balanceView.balance);
      switch (balanceView.employeeId) {
        case requestor.employeeId:
          myCreditHistoryBalanceViewDto.requestedBy = MyCreditHistoryRequestedBy.ME;
          break;
        case MyCreditHistoryRequestedBy.HUTOM:
          myCreditHistoryBalanceViewDto.requestedBy = MyCreditHistoryRequestedBy.HUTOM;
          break;
        default:
          myCreditHistoryBalanceViewDto.requestedBy = MyCreditHistoryRequestedBy.OTHERS;
      }
      myCreditHistoryBalanceViewDto.createdAt = balanceView.createdAt.toISOString();

      return myCreditHistoryBalanceViewDto;
    });
  }
}
