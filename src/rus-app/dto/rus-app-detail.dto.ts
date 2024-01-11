import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { RusCase } from "@src/common/entity/rus-case.entity";

@Exclude()
export class RusAppDetailDto {
  @Expose()
  @ApiProperty({ description: "RusCase DB id" })
  id: number;

  @ApiProperty({ description: "huID" })
  huId: string;

  @ApiProperty({ description: "Patient ID" })
  patientId: string;

  @ApiProperty({ description: "Patient Name" })
  patientName: string;

  @ApiProperty({ description: "hu3D 파일 다운로드 URL" })
  hu3dURL: string;

  @ApiProperty({ description: "수술 유형" })
  operationType: string;

  @ApiProperty({ description: "hu3D 파일 버전" })
  version: number;

  static fromMany(rusCases: RusCase[], serverUrl: string): RusAppDetailDto[] {
    return rusCases.map((rusCase) => {
      const rusAppDetailDto = plainToInstance(RusAppDetailDto, rusCase);
      rusAppDetailDto.id = rusCase.id;
      rusAppDetailDto.huId = rusCase.study.huId;
      rusAppDetailDto.patientId = rusCase.study.patientId;
      rusAppDetailDto.patientName = rusCase.study.patientName;
      rusAppDetailDto.operationType = rusCase.clinicalInfo.operationType;
      rusAppDetailDto.version = rusCase.hu3d.version;
      if (rusCase.hu3d?.filePath) {
        rusAppDetailDto.hu3dURL = `${serverUrl}/rus-app/rus-cases/${rusCase.id.toString()}/download-hu3d`;
      } else {
        rusAppDetailDto.hu3dURL = null;
      }
      return rusAppDetailDto;
    });
  }
}
