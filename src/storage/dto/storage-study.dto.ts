import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Study } from "@src/common/entity/study.entity";
import { Hu3dDto } from "@src/rus-case/dto/hu3d.dto";
import { DicomDto } from "@src/study/dto/dicom.dto";
import { ClinicalInfoDto } from "@src/rus-case/dto/clinical-info.dto";

@Exclude()
export class StorageStudyDto {
  @Expose()
  @ApiProperty({ description: "Study DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "Patient Id" })
  patientId: string;

  @Expose()
  @ApiProperty({ description: "Patient Name" })
  patientName: string;

  @Expose()
  @ApiProperty({ description: "huID" })
  huId: string;

  @Expose()
  @ApiProperty({ description: "생성 날짜", type: "(ISO)string" })
  createdAt: string;

  @ApiProperty({ description: "dicom 정보(nullable: 파일이 존재하지 않는 경우)", nullable: true })
  dicom: DicomDto;

  @ApiProperty({ description: "hu3d 정보(nullable: 파일이 존재하지 않는 경우)", nullable: true })
  hu3d: Hu3dDto | null;

  @ApiProperty({ description: "수술 유형(nullable: 케이스로 등록되지 않은 경우)", nullable: true })
  clinicalInfo: ClinicalInfoDto | null;

  static fromMany(studies: Study[], serviceCode: string): StorageStudyDto[] {
    return studies.map((study) => {
      const storageStudyDto = plainToInstance(StorageStudyDto, study);

      storageStudyDto.id = study.id;
      storageStudyDto.patientId = study.patientId;
      storageStudyDto.patientName = study.patientName;
      storageStudyDto.huId = study.huId;
      storageStudyDto.createdAt = study.createdAt.toISOString();
      storageStudyDto.dicom = DicomDto.from(study.dicom, serviceCode);
      storageStudyDto.hu3d = study.rusCase?.hu3d ? Hu3dDto.from(study.rusCase.hu3d) : null;
      storageStudyDto.clinicalInfo = study.rusCase?.clinicalInfo ? ClinicalInfoDto.from(study.rusCase.clinicalInfo) : null;

      return storageStudyDto;
    });
  }
}
