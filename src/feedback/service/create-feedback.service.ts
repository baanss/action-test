import { Connection } from "typeorm";
import { HttpException, Injectable } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { FeedbackRepository } from "@src/feedback/repository/feedback.repository";
import { PostFeedbackServiceReq } from "@src/feedback/dto";

@Injectable()
export class CreateFeedbackService {
  constructor(private readonly connection: Connection) {}

  // feedback 레코드 생성
  async create(postFeedbackServiceReq: PostFeedbackServiceReq) {
    const queryRunner = this.connection.createQueryRunner();

    const feedbackRepository = queryRunner.manager.getCustomRepository(FeedbackRepository);
    const rusCaseRepository = queryRunner.manager.getCustomRepository(RusCaseRepository);

    const { huId, message, writerEmail } = postFeedbackServiceReq;

    // huId를 가진 케이스 조회한다
    const rusCase = await rusCaseRepository.getOneByHuId(huId);
    if (!rusCase) {
      throw new HttpException(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID, HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID.statusCode);
    }

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let feedback = null;

      if (rusCase?.feedback) {
        // 이미 등록되어 있다면, 수정한다.
        feedback = await feedbackRepository.findOne(rusCase.feedback.id);
        feedback.update(message, writerEmail);
        await feedbackRepository.save(feedback);
      } else {
        // 등록되어 있지 않다면, 생성한다.
        feedback = await feedbackRepository.save({ rusCase, message, writerEmail });
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return feedback.id;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }
}
