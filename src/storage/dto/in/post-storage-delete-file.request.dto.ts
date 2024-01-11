import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";
import { FileType } from "@src/common/constant/enum.constant";

export class PostStorageDeleteFileReq {
  @ApiProperty({ description: "스터디 DB id", isArray: true, type: Number })
  @IsArray()
  studyIds: Array<number>;

  @ApiProperty({ description: "파일 유형", isArray: true, enum: FileType })
  @IsArray()
  types: Array<FileType>;

  @ApiProperty({ description: "사용자 암호" })
  @IsString()
  password: string;
}
