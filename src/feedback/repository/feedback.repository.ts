import { EntityRepository, Repository } from "typeorm";
import { Feedback } from "@src/common/entity/feedback.entity";

@EntityRepository(Feedback)
export class FeedbackRepository extends Repository<Feedback> {
  upsertById(feedback: Feedback) {
    return this.createQueryBuilder()
      .insert()
      .into(Feedback, ["id", "writerEmail", "message"])
      .values(feedback)
      .orUpdate(["message", "writer_user_id"], ["id"])
      .execute();
  }
}
