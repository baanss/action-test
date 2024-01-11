import { ApiProperty } from "@nestjs/swagger";
import { GetAllUserViewDto } from "@src/user/dto/out/get-all-user-view.dto";

export class GetAllUserRes {
  @ApiProperty({ description: "크레딧 내역 배열", type: GetAllUserViewDto, isArray: true })
  data: GetAllUserViewDto[];

  @ApiProperty({ description: "조회된 크레딧 내역 개수", type: Number })
  count: number;
}
