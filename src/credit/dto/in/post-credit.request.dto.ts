import { IsNumber, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PostCreditAllocateReq {
  @ApiProperty({ description: "크레딧 변동량" })
  @IsNumber()
  @Min(1)
  @Max(9999)
  quantity: number;
}

export class PostCreditRevokeReq {
  @ApiProperty({ description: "크레딧 변동량" })
  @IsNumber()
  @Min(1)
  @Max(9999)
  quantity: number;
}
