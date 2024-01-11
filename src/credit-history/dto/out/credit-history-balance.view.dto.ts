import { ApiProperty } from "@nestjs/swagger";
import { BalanceView } from "@src/common/entity/balance.view.entity";
import { Exclude, Expose, plainToInstance } from "class-transformer";

@Exclude()
export class CreditHistoryBalanceViewDto {
  @Expose()
  @ApiProperty({ description: "Credit History DB ID" })
  id: number;

  @Expose()
  @ApiProperty({ description: "사용자 계정 아이디" })
  employeeId: string;

  @Expose()
  @ApiProperty({ description: "사용자 이름" })
  name: string;

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
  @ApiProperty({ description: "Credit History 생성일자" })
  createdAt: string;

  @Expose()
  @ApiProperty({ description: "HuID" })
  huId: string | null;

  @Expose()
  @ApiProperty({ description: "가입중인 사용자 여부" })
  isRegisteredUser: boolean;

  static fromMany(balanceViews: BalanceView[]): CreditHistoryBalanceViewDto[] {
    return balanceViews.map((balanceView) => {
      const creditHistoryBalanceViewDto = plainToInstance(CreditHistoryBalanceViewDto, balanceView);

      creditHistoryBalanceViewDto.id = balanceView.id;
      creditHistoryBalanceViewDto.employeeId = balanceView.employeeId;
      creditHistoryBalanceViewDto.name = balanceView.name;
      creditHistoryBalanceViewDto.category = balanceView.category;
      creditHistoryBalanceViewDto.quantity = Math.abs(balanceView.quantity);
      creditHistoryBalanceViewDto.balance = Number(balanceView.balance);
      creditHistoryBalanceViewDto.createdAt = balanceView.createdAt.toISOString();
      creditHistoryBalanceViewDto.huId = balanceView.huId ?? null;
      creditHistoryBalanceViewDto.isRegisteredUser = !balanceView.isUserRequest || (balanceView.isUserRequest && !!balanceView.userId);

      return creditHistoryBalanceViewDto;
    });
  }
}
