import { ApiProperty } from "@nestjs/swagger";
import { Feedback } from "@src/common/entity/feedback.entity";
import { Exclude, Expose, plainToClass } from "class-transformer";

@Exclude()
export class FeedbackDto {
  @Expose()
  @ApiProperty({ description: "Feedback DB id" })
  id: number;

  @Expose()
  @ApiProperty({ description: "메시지" })
  message: string;

  @Expose()
  @ApiProperty({ description: "작성자 email" })
  writerEmail: string;

  @ApiProperty({ description: "생성 날짜" })
  createdAt: string;

  @ApiProperty({ description: "수정 날짜" })
  updatedAt: string;

  static from(feedback: Feedback) {
    const feedbackDto = plainToClass(FeedbackDto, feedback);
    feedbackDto.createdAt = feedback.createdAt.toISOString();
    feedbackDto.updatedAt = feedback.updatedAt.toISOString();

    return feedbackDto;
  }
}
