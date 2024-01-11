import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class GetCreditRes {
  @ApiProperty({ description: "크레딧 총량" })
  @IsNumber()
  totalCredit: number;
}
