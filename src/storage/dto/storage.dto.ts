import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class StorageStatusDto {
  @ApiProperty({ description: "hu3d 파일이 차지하는 용량" })
  @Expose()
  hu3dUsed: number;

  @Expose()
  @ApiProperty({ description: "CT 파일이 차지하는 용량" })
  ctUsed: number;

  @ApiProperty({ description: "기타 파일이 차지하는 용량(설치파일, 프로필 이미지 등)" })
  @Expose()
  etcUsed: number;

  @ApiProperty({ description: "저장소 잔량(bytes)" })
  @Expose()
  free: number;

  @ApiProperty({ description: "저장소 전체 용량(bytes)" })
  @Expose()
  total: number;
}
