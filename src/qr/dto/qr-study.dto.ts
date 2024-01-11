import * as moment from "moment";
import { ApiProperty } from "@nestjs/swagger";
import { FindStudyDto } from "@src/qr/dto/out/get-qr-study.service-response.dto";

export class QrStudyDto {
  @ApiProperty({
    example: "2022-11-04",
    description: "스터디 날짜",
  })
  studyDate: string;

  @ApiProperty({
    example: "123456",
    description: "Patient ID",
  })
  patientId: string;

  @ApiProperty({
    example: "1002",
    description: "스터디 인스턴스 UID",
  })
  studyInstanceUID: string;

  @ApiProperty({
    example: "ISO_IR 100",
    description: "Specific Character Set",
    nullable: true,
  })
  specificCharacterSet: string | null;

  @ApiProperty({
    example: "MR BREAS, UNIT",
    description: "Study Description",
    nullable: true,
  })
  studyDescription: string | null;

  @ApiProperty({
    example: "테스트1",
    description: "Patient Name",
    nullable: true,
  })
  patientName: string | null;

  @ApiProperty({
    description: "Study ID",
    nullable: true,
  })
  studyId: string | null;

  @ApiProperty({
    description: "Modality",
    example: "CT",
    nullable: true,
  })
  modality: string | null;

  @ApiProperty({
    enum: ["M", "F", "O"],
    description: "Patient Sex",
    nullable: true,
  })
  sex: string | null;

  @ApiProperty({
    example: "063Y",
    description: "Patient Age",
    nullable: true,
  })
  age: string | null;

  @ApiProperty({
    example: 300,
    description: "시리즈 갯수",
    nullable: true,
  })
  seriesCount: number | null;

  @ApiProperty({
    example: 5,
    description: "인스턴스 갯수",
    nullable: true,
  })
  instancesCount: number | null;

  static fromMany(studies: FindStudyDto[]): QrStudyDto[] {
    return studies.map((study) => {
      const qrStudyDto = new QrStudyDto();

      qrStudyDto.specificCharacterSet = study.specificCharacterSet;
      qrStudyDto.studyDate = moment(study.studyDate ?? "19000101").format("YYYY-MM-DD");
      qrStudyDto.studyDescription = study.studyDescription;
      qrStudyDto.patientName = study.patientName;
      qrStudyDto.patientId = study.patientId;
      qrStudyDto.age = study.patientAge;
      qrStudyDto.sex = study.patientSex;
      qrStudyDto.studyInstanceUID = study.studyInstanceUID;
      qrStudyDto.studyId = study.studyId;
      qrStudyDto.modality = study.modality;
      qrStudyDto.seriesCount = parseInt(study.numberOfStudyRelatedSeries);
      qrStudyDto.instancesCount = parseInt(study.numberOfStudyRelatedInstances);

      return qrStudyDto;
    });
  }
}
