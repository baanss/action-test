import { ApiProperty } from "@nestjs/swagger";
import { FileType } from "@src/common/constant/enum.constant";
import { IsArray } from "class-validator";

export class FailedDeleteFileDto {
  @ApiProperty({ description: "파일 유형", enum: [FileType.CT, FileType.HU3D] })
  type: string;

  @ApiProperty({ description: "파일명", nullable: true })
  fileName: string | null;

  @ApiProperty({
    description: "에러 코드",
    examples: {
      NOT_FOUND_STUDY_WITH_ID: { describe: "study 조회되지 않음" },
      NOT_FOUND_DICOM_WITH_STUDY_ID: { describe: "매칭된 dicom 존재하지 않음" },
      NOT_FOUND_HU3D_WITH_STUDY_ID: { describe: "매칭된 hu3d 존재하지 않음" },
      UNEXPECTED_ERROR: { describe: "예기치 못한 에러" },
    },
  })
  error: string;
}

class MetaDto {
  @ApiProperty({ description: "실패 이유 배열", isArray: true, type: FailedDeleteFileDto })
  failed: FailedDeleteFileDto[];
}

export class PostStorageDeleteFileRes {
  @ApiProperty({ description: "성공한 스터디 id", isArray: true, type: Number })
  @IsArray()
  ids: number[];

  @ApiProperty({ description: "부가 정보", type: MetaDto })
  meta: MetaDto;
}
