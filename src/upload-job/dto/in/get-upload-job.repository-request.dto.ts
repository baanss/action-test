import { OrderQuery, UploadJobStatus } from "@src/common/constant/enum.constant";
import { IsIn, IsOptional, IsString } from "class-validator";

export class GetUploadJobRepositoryReq {
  @IsString()
  serverCode: string;

  @IsIn(Object.values(OrderQuery))
  order?: string;
}

export class GetUploadJobByStudyInstanceUIDRepositoryReq {
  @IsOptional()
  @IsString()
  studyInstanceUID?: string;

  @IsOptional()
  @IsString()
  status?: UploadJobStatus;
}
