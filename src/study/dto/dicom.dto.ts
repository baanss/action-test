import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Dicom } from "@src/common/entity/dicom.entity";
import { RusServiceCode } from "@src/common/middleware/user-auth.middleware";

@Exclude()
export class DicomDto {
  @Expose()
  @ApiProperty({ description: "Dicom DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "파일명" })
  fileName: string;

  @Expose()
  @ApiProperty({ description: "파일 용량" })
  fileSize: number;

  @ApiProperty({ description: "파일 경로", nullable: true })
  filePath: string;

  studyId: number;

  static from(dicom: Dicom, serviceCode: string): DicomDto {
    const dicomDto = plainToInstance(DicomDto, dicom);

    dicomDto.id = dicom.id;
    dicomDto.fileName = dicom.fileName;
    if (dicomDto.fileName) {
      dicomDto.fileName = dicomDto.fileName.replace(".zip", `_${serviceCode === RusServiceCode.KIDNEY ? "kidney" : "stomach"}_huCT.zip`);
    }
    dicomDto.fileSize = dicom.fileSize;
    dicomDto.filePath = dicom.filePath ? "valid" : null;

    return dicomDto;
  }
}
