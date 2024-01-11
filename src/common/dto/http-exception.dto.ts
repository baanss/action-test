import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";

export class HttpExceptionDto {
  @ApiProperty({ description: "상태코드" })
  statusCode: HttpStatus;

  @ApiProperty({ description: "에러메시지" })
  message: string;

  @ApiProperty({ description: "에러 분류" })
  error: string;
}
