import { ApiProperty } from "@nestjs/swagger";

export class GetQrEchoRes {
  @ApiProperty({
    description: "메시지",
    example: "QR 서버 연결 성공",
  })
  readonly message: string;
}
