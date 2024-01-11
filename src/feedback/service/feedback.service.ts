import { Injectable } from "@nestjs/common";
import { Feedback } from "@src/common/entity/feedback.entity";
import { FeedbackRepository } from "@src/feedback/repository/feedback.repository";

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  // 하나 조회하기(id 기준)
  async getOneById(id: number): Promise<Feedback> {
    const feedback = await this.feedbackRepository.findOne(id);
    return feedback;
  }
}
