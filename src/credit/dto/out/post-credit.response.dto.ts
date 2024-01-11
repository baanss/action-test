import { IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PostCreditAllocateRes {
  @ApiProperty({ description: "크레딧 총량" })
  @IsNumber()
  totalCredit: number;
}

export class PostCreditRevokeRes {
  @ApiProperty({ description: "크레딧 총량" })
  @IsNumber()
  totalCredit: number;
}
