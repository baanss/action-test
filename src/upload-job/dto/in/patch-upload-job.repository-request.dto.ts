import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional } from "class-validator";
import { UploadJobStatus } from "@src/common/constant/enum.constant";

export class PatchUploadJobRepositoryReq {
  @IsOptional()
  @IsIn(Object.values(UploadJobStatus))
  @ApiProperty({ description: "upload-job 결과 상태", enum: UploadJobStatus, required: false })
  status?: string;

  @IsOptional()
  @ApiProperty({ description: "upload-job 결과 메시지", required: false })
  message?: string;

  @IsOptional()
  @ApiProperty({ description: "upload-job Study DB id", required: false })
  studyId?: number;

  @IsOptional()
  @ApiProperty({ description: "upload-job huId 할당 여부", required: false })
  isAquired?: boolean;
}
