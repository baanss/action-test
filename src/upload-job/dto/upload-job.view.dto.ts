import * as moment from "moment";
import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { UploadJobStatus } from "@src/common/constant/enum.constant";
import { UploadJobView } from "@src/common/entity/upload-job.view.entity";

@Exclude()
export class UploadJobViewDto {
  @Expose()
  @ApiProperty({ description: "UploadJob DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "UploadJob huID" })
  huId: string;

  @Expose()
  @ApiProperty({ description: "UploadJob 진행 상태", enum: UploadJobStatus })
  status: string;

  @Expose()
  @ApiProperty({ description: "UploadJob 생성 시간" })
  createdAt: string;

  @Expose()
  @ApiProperty({ description: "UploadJob 수정 시간" })
  updatedAt: string;

  @Expose()
  @ApiProperty({ description: "성별, study.sex 또는 uploadJob.sex", nullable: true })
  sex: string | null;

  @Expose()
  @ApiProperty({ description: "나이, study.age 또는 uploadJob.age", nullable: true })
  age: number | null;

  @Expose()
  @ApiProperty({ description: "Patient ID, study.patientId 또는 uploadJob.patientId", nullable: true })
  patientId: string | null;

  @Expose()
  @ApiProperty({ description: "Patient Name, study.patientName 또는 uploadJob.patientName", nullable: true })
  patientName: string | null;

  @Expose()
  @ApiProperty({ description: "Study Date", nullable: true })
  studyDate: string | null;

  @Expose()
  @ApiProperty({ description: "Study Descriptioin", nullable: true })
  studyDescription: string | null;

  @Expose()
  @ApiProperty({ description: "시리즈(폴더) 개수", nullable: true })
  seriesCount: number | null;

  @Expose()
  @ApiProperty({ description: "인스턴스(파일) 개수", nullable: true })
  instancesCount: number | null;

  @Expose()
  @ApiProperty({ description: "RUS 등록 여부", nullable: true })
  isRegistered: boolean | null;

  @Expose()
  @ApiProperty({ description: "uploadJob 요청 계정 이름", nullable: true })
  userName: string | null;

  aeMode: string;

  studyId: number;

  userId: number;

  dicomId: number;

  dicomFilePath: string;

  static from(uploadJobView: UploadJobView): UploadJobViewDto {
    const uploadJobViewDto = plainToInstance(UploadJobViewDto, uploadJobView);

    uploadJobViewDto.id = uploadJobView.id;
    uploadJobViewDto.huId = uploadJobView.huId;
    uploadJobViewDto.studyDescription = uploadJobView.studyDescription;
    uploadJobViewDto.seriesCount = uploadJobView.studySeriesCount;
    uploadJobViewDto.instancesCount = uploadJobView.studyInstancesCount;
    uploadJobViewDto.userName = uploadJobView.userName;
    uploadJobViewDto.createdAt = uploadJobView.createdAt.toISOString();
    uploadJobViewDto.updatedAt = uploadJobView.updatedAt.toISOString();
    uploadJobViewDto.studyDate = uploadJobView.studyDate?.toISOString() ?? null;
    uploadJobViewDto.studyId = uploadJobView.studyId;
    uploadJobViewDto.status = uploadJobView.status;

    if (uploadJobView.status === UploadJobStatus.IN_PROGRESS) {
      uploadJobViewDto.isRegistered = null;
    } else {
      uploadJobViewDto.isRegistered = uploadJobView.isRegistered;
    }

    // NOTE: filePath 비식별 처리
    uploadJobViewDto.dicomId = uploadJobView.dicomId;
    uploadJobViewDto.dicomFilePath = uploadJobView.dicomFilePath ? "valid" : null;

    // NOTE: study 또는 uploadJob 정보
    uploadJobViewDto.sex = uploadJobView.sex;
    uploadJobViewDto.age = uploadJobView.age;
    uploadJobViewDto.patientId = uploadJobView.patientId;
    uploadJobViewDto.patientName = uploadJobView.patientName;
    if (uploadJobView.studyId) {
      uploadJobViewDto.sex = uploadJobView.studySex;
      uploadJobViewDto.age = uploadJobView.studyAge;
      uploadJobViewDto.patientId = uploadJobView.studyPatientId;
      uploadJobViewDto.patientName = uploadJobView.studyPatientName;
    }

    return uploadJobViewDto;
  }
}
