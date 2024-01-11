import { IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetUploadJobHuIdReq {
  @IsOptional()
  @ApiProperty({ description: "StudyInstanceUID", required: false })
  studyInstanceUID?: string;

  // TODO? 기획 정책 보강 - dicom send 요청에서도 저장할 수 있는 항목(patientId, patientName, age, sex, studyDate, studyDescription)
}
