import { ApiProperty } from "@nestjs/swagger";
import { UpdateLog } from "@src/common/entity/update-log.entity";
import { Exclude, Expose, plainToInstance } from "class-transformer";

@Exclude()
export class UpdateLogDto {
  @Expose()
  @ApiProperty({description: "DB id"})
  id: number;

  @Expose()
  @ApiProperty({description: "파일명"})
  fileName: string;

  @Expose()
  @ApiProperty({description: "생성 날짜"})
  createdAt: string;

  @ApiProperty({description: "수정 날짜"})
  updatedAt: string;
  @ApiProperty({description: "파일 다운로드 URL"})
  fileURL: string;
  @ApiProperty({description: "파일 용량"})
  fileSize: number;

  static from(updateLog: UpdateLog, serverUrl: string) {
    const updateLogDto = plainToInstance(UpdateLogDto, updateLog);
    updateLogDto.fileURL = updateLog.getDownloadUrl(serverUrl);
    updateLogDto.fileSize = updateLog.fileSize;
    return updateLogDto;
  }
}
