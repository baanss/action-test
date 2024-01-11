import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { Surgeon } from "@src/common/entity/surgeon.entity";

@Exclude()
export class SurgeonDto {
  @Expose()
  @ApiProperty({ description: "DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "이름" })
  name: string;

  @Expose()
  @ApiProperty({ description: "생성 시간(ISO String)" })
  createdAt: string;

  @Expose()
  @ApiProperty({ description: "수정 시간(ISO String)" })
  updatedAt: string;

  static fromMany(surgeons: Surgeon[]): SurgeonDto[] {
    return surgeons.map((surgeon) => {
      const surgeonDto = plainToInstance(SurgeonDto, surgeon);
      return surgeonDto;
    });
  }
}
