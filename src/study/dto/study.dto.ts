import { Exclude, Expose, plainToClass } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Study } from "@src/common/entity/study.entity";
import { DicomDto } from "@src/study/dto/dicom.dto";

@Exclude()
export class StudyDto {
  @Expose()
  @ApiProperty({ description: "Study DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "huID" })
  huId: string;

  @Expose()
  @ApiProperty({ description: "Patient ID" })
  patientId: string;

  @Expose()
  @ApiProperty({ description: "Patient Name" })
  patientName: string;

  @Expose()
  @ApiProperty({ description: "Study Date" })
  studyDate: string;

  @Expose()
  @ApiProperty({ description: "Study Description" })
  studyDescription: string;

  @Expose()
  @ApiProperty({ description: "시리즈 개수" })
  seriesCount: number;

  @Expose()
  @ApiProperty({ description: "인스턴스 개수" })
  instancesCount: number;

  @ApiProperty({ description: "환자 나이", nullable: true })
  age: number | null;

  @ApiProperty({ description: "환자 성별", nullable: true })
  sex: string | null;

  @Expose()
  @ApiProperty({ description: "생성 날짜" })
  createdAt: string;

  @Expose()
  @ApiProperty({ description: "RUS Case 등록 여부" })
  isRegistered: boolean;

  dicom: DicomDto;

  static from(study: Study): StudyDto {
    const studyDto = plainToClass(StudyDto, study);
    studyDto.studyDate = study.studyDate.toISOString();
    studyDto.createdAt = study.createdAt.toISOString();
    studyDto.age = study.age ?? null;
    studyDto.sex = study.sex ?? null;

    return studyDto;
  }
}
