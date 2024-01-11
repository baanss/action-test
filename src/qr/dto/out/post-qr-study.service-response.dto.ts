import { ApiProperty } from "@nestjs/swagger";
import { UploadJobStatus } from "@src/common/constant/enum.constant";

export class PostQrStudyServiceRes {
  @ApiProperty({ description: "상태코드", enum: [UploadJobStatus.DONE, UploadJobStatus.REJECT] })
  readonly status: string;

  @ApiProperty({ description: "메시지" })
  readonly message: string;
}
