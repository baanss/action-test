import { ApiProperty } from "@nestjs/swagger";
import { Installer } from "@src/common/entity/installer.entity";
import { Exclude, Expose, plainToInstance } from "class-transformer";

@Exclude()
export class InstallerDto {
  @Expose()
  @ApiProperty({description: "Installer DB id"})
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

  static from(installer: Installer, serverUrl: string) {
    const installerDto = plainToInstance(InstallerDto, installer);
    installerDto.fileURL = installer.getDownloadUrl(serverUrl);
    installerDto.fileSize = installer.fileSize;
    return installerDto;
  }
}
