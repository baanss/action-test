import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { ClinicalInfo } from "@src/common/entity/clinical-info.entity";

@Exclude()
export class ClinicalInfoDto {
  @Expose()
  @ApiProperty({ description: "ClinicalInfo DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "수술 유형" })
  operationType: string;

  @Expose()
  @ApiProperty({ description: "hu3D 제작 완료일", type: "(ISO)String" })
  deliveryDate: string;

  @Expose()
  @ApiProperty({ description: "나이" })
  age: number;

  @Expose()
  @ApiProperty({ description: "성별" })
  sex: string;

  @Expose()
  @ApiProperty({ description: "키" })
  height: number;

  @Expose()
  @ApiProperty({ description: "몸무게" })
  weight: number;

  @Expose()
  @ApiProperty({ description: "출산 여부" })
  childbirth: boolean;

  @Expose()
  @ApiProperty({ description: "수술 날짜", type: "(ISO)String", nullable: true })
  operationDate: string | null;

  @Expose()
  @ApiProperty({ description: "메모", nullable: true })
  memo: string | null;

  @Expose()
  @ApiProperty({ description: "메모(Cancer description)", nullable: true })
  remark: string | null;

  static from(clinicalInfo: ClinicalInfo): ClinicalInfoDto {
    const clinicalInfoDto = plainToInstance(ClinicalInfoDto, clinicalInfo);

    clinicalInfoDto.id = clinicalInfo.id;
    clinicalInfoDto.operationType = clinicalInfo.operationType;
    clinicalInfoDto.deliveryDate = clinicalInfo.deliveryDate.toISOString();
    clinicalInfoDto.age = clinicalInfo.age;
    clinicalInfoDto.sex = clinicalInfo.sex;
    clinicalInfoDto.height = clinicalInfo.height;
    clinicalInfoDto.weight = clinicalInfo.weight;
    clinicalInfoDto.childbirth = clinicalInfo.childbirth;
    clinicalInfoDto.operationDate = clinicalInfo.operationDate?.toISOString() ?? null;
    clinicalInfoDto.memo = clinicalInfo.memo ?? null;
    clinicalInfoDto.remark = clinicalInfo.remark ?? null;

    return clinicalInfoDto;
  }
}
