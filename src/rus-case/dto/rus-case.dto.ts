import { Exclude, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { ClinicalInfoDto } from "@src/rus-case/dto/clinical-info.dto";
import { Hu3dDto } from "@src/rus-case/dto/hu3d.dto";
import { RusCase } from "@src/common/entity/rus-case.entity";
import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { PickType } from "@nestjs/swagger";
import { StudyDto } from "@src/study/dto/study.dto";
import { DicomDto } from "@src/study/dto/dicom.dto";
import { Study } from "@src/common/entity/study.entity";

class PickStudyDto extends PickType(StudyDto, ["id", "huId", "patientId", "patientName", "dicom"]) {
  static from(study: Study): StudyDto {
    const studyDto = plainToInstance(StudyDto, study);
    studyDto.id = study.id;
    studyDto.huId = study.huId;
    studyDto.patientId = study.patientId;
    studyDto.patientName = study.patientName;
    return studyDto;
  }
}

@Exclude()
export class RusCaseDto {
  @ApiProperty({ description: "RusCase DB id" })
  id: number;

  @ApiProperty({ description: "작업 상태", enum: RusCaseStatus })
  status: string;

  @ApiProperty({ description: "Study 정보" })
  study: PickStudyDto;

  @ApiProperty({ description: "ClinicalInfo 정보" })
  clinicalInfo: ClinicalInfoDto;

  @ApiProperty({ description: "hu3d 정보", nullable: true })
  hu3d: Hu3dDto | null;

  @ApiProperty({ description: "hu3d 파일명", nullable: true })
  hu3dFileName: string | null;

  @ApiProperty({ description: "hu3d 파일 다운로드 URL", nullable: true })
  hu3dURL: string | null;

  @ApiProperty({ description: "다이콤 파일 다운로드 URL", nullable: true })
  dicomURL: string | null;

  @ApiProperty({ description: "케이스를 등록한 사용자 ID ", nullable: true })
  userId: number | null;

  @ApiProperty({ description: "Feedback 정보", nullable: true })
  feedbackId: number | null;

  @ApiProperty({ description: "huID" })
  huId: string;

  @ApiProperty({ description: "Patient ID" })
  patientId: string;

  @ApiProperty({ description: "Patient Name" })
  patientName: string;

  @ApiProperty({ description: "수술 유형" })
  operationType: string;

  @ApiProperty({ description: "hu3d 제작 완료일(ISO String)" })
  deliveryDate: string;

  @ApiProperty({ description: "나이" })
  age: number;

  @ApiProperty({ description: "성별", enum: ["M", "F", "O"] })
  sex: string;

  @ApiProperty({ description: "키" })
  height: number;

  @ApiProperty({ description: "몸무게" })
  weight: number;

  @ApiProperty({ description: "출산 여부" })
  childbirth: boolean;

  @ApiProperty({ description: "수술 날짜(ISO String)", nullable: true })
  operationDate: string | null;

  @ApiProperty({ description: "메모", nullable: true })
  memo: string | null;

  @ApiProperty({ description: "메모(Cancer description)", nullable: true })
  remark: string | null;

  @ApiProperty({ description: "rusCase 생성자 이름", nullable: true })
  userName: string | null;

  @ApiProperty({ description: "Surgeon 이름", nullable: true })
  surgeonName: string | null;

  static from(rusCase: RusCase, serverUrl: string, serviceCode: string): RusCaseDto {
    const rusCaseDto = plainToInstance(RusCaseDto, rusCase);
    rusCaseDto.id = rusCase.id;
    rusCaseDto.status = rusCase.status;
    rusCaseDto.surgeonName = rusCase.surgeon ? rusCase.surgeon.name : null;
    rusCaseDto.hu3dURL = rusCase.hu3d?.filePath ? `${serverUrl}/rus-cases/${rusCase.id.toString()}/download-hu3d` : null;
    rusCaseDto.dicomURL = rusCase.study.dicom?.filePath ? `${serverUrl}/rus-cases/${rusCase.id.toString()}/download-huct` : null;
    rusCaseDto.study = PickStudyDto.from(rusCase.study);
    rusCaseDto.clinicalInfo = ClinicalInfoDto.from(rusCase.clinicalInfo);
    rusCaseDto.hu3d = rusCase.hu3d ? Hu3dDto.from(rusCase.hu3d) : null;
    rusCaseDto.study.dicom = rusCase.study.dicom ? DicomDto.from(rusCase.study.dicom, serviceCode) : null;

    return rusCaseDto;
  }

  static fromMany(rusCases: RusCase[], serverUrl: string): RusCaseDto[] {
    return rusCases.map((rusCase) => {
      const rusCaseDto = plainToInstance(RusCaseDto, rusCase);
      rusCaseDto.id = rusCase.id;
      rusCaseDto.status = rusCase.status;
      rusCaseDto.huId = rusCase.study.huId;
      rusCaseDto.patientId = rusCase.study.patientId;
      rusCaseDto.patientName = rusCase.study.patientName;
      rusCaseDto.operationType = rusCase.clinicalInfo.operationType;
      rusCaseDto.deliveryDate = rusCase.clinicalInfo.deliveryDate.toISOString();
      rusCaseDto.age = rusCase.clinicalInfo.age;
      rusCaseDto.sex = rusCase.clinicalInfo.sex;
      rusCaseDto.height = rusCase.clinicalInfo.height;
      rusCaseDto.weight = rusCase.clinicalInfo.weight;
      rusCaseDto.childbirth = rusCase.clinicalInfo.childbirth;
      rusCaseDto.operationDate = rusCase.clinicalInfo.operationDate?.toISOString() ?? null;
      rusCaseDto.memo = rusCase.clinicalInfo.memo ?? null;
      rusCaseDto.remark = rusCase.clinicalInfo.remark ?? null;
      rusCaseDto.userName = rusCase.user?.name ?? null;
      rusCaseDto.hu3dURL = rusCase.hu3d?.filePath ? `${serverUrl}/rus-cases/${rusCase.id.toString()}/download-hu3d` : null;
      rusCaseDto.hu3dFileName = rusCase.hu3d?.fileName ?? null;
      rusCaseDto.feedbackId = rusCase.feedback?.id ?? null;
      rusCaseDto.surgeonName = rusCase.surgeon?.name ?? null;

      return rusCaseDto;
    });
  }
}
