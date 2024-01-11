import * as moment from "moment";
import { ApiProperty } from "@nestjs/swagger";
import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { IsBoolean, IsISO8601, IsIn, IsOptional, IsString } from "class-validator";

export class PatchRusCaseReq {
  @ApiProperty({ description: "작업 취소 요청" })
  @IsBoolean()
  isCancelled: boolean;
}

export class PatchMatchedRusCaseQueryReq {
  @ApiProperty({ description: "수정할 RUS Case의 huID", required: true })
  @IsString()
  huId: string;
}

export class PatchMatchedRusCaseBodyReq {
  @ApiProperty({ description: "작업 상태", required: false, enum: RusCaseStatus })
  @IsOptional()
  @IsIn(Object.values(RusCaseStatus))
  status?: RusCaseStatus;

  @ApiProperty({ description: "수술 날짜(UTC 기준, ISO String)", required: false, example: moment("2000-01-01", "YYYY-MM-DD").toISOString() })
  @IsOptional()
  @IsISO8601()
  operationDate?: string;

  @ApiProperty({ description: "hu3D 작업 완료 날짜(UTC 기준, ISO String)", required: false, example: moment("2000-01-01", "YYYY-MM-DD").toISOString() })
  @IsOptional()
  @IsISO8601()
  deliveryDate?: string;
}
