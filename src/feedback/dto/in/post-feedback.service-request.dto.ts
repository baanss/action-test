import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PostFeedbackServiceReq {
  @IsString()
  @ApiProperty({ description: "피드백을 등록할 케이스의 huID" })
  huId: string;

  @IsString()
  @ApiProperty({ description: "피드백 메시지" })
  message: string;

  @IsString()
  @ApiProperty({ description: "작성자 email" })
  writerEmail: string;
}
