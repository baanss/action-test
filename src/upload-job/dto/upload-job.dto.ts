import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { AeMode, UploadJobStatus } from "@src/common/constant/enum.constant";

@Exclude()
export class UploadJobDto {
  @Expose()
  @ApiProperty({ description: "UploadJob DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "huId", uniqueItems: true })
  huId: string;

  @Expose()
  @ApiProperty({ description: "AE mode", enum: AeMode, nullable: true })
  aeMode: string;

  @Expose()
  @ApiProperty({ description: "UploadJob 진행 상태", enum: UploadJobStatus, default: UploadJobStatus.IN_PROGRESS })
  status: string;

  @Expose()
  @ApiProperty({ description: "UploadJob 결과 메시지", nullable: true })
  message: string;

  @Expose()
  @ApiProperty({ description: "Study DB id", nullable: true })
  studyId: number;

  @Expose()
  @ApiProperty({ description: "huId 할당 여부", default: false })
  isAquired: boolean;

  @Expose()
  @ApiProperty({ description: "생성 날짜", type: "timestamptz" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "수정 날짜", type: "timestamptz" })
  updatedAt: Date;
}
