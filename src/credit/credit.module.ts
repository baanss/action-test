import { Module } from "@nestjs/common";
import { CreditController } from "@src/credit/credit.controller";
import { CreditHistoryModule } from "@src/credit-history/credit-history.module";

@Module({
  imports: [CreditHistoryModule],
  controllers: [CreditController],
})
export class CreditModule {}
