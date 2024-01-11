import { ApiProperty } from "@nestjs/swagger";

class MetaDto {
  @ApiProperty({ description: "비밀번호 설정(or 재설정) 시점 (ISO String)" })
  passwordSettingAt: string;
}

export class UpdatePasswordRes {
  @ApiProperty({ description: "처리된 사용자의 DB id" })
  id: number;

  @ApiProperty({ description: "처리된 사용자의 metadata" })
  meta: MetaDto;
}
