import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { FeedbackController } from "@src/feedback/feedback.controller";
import { FeedbackRepository } from "@src/feedback/repository/feedback.repository";
import { CreateFeedbackService } from "@src/feedback/service/create-feedback.service";
import { FeedbackService } from "@src/feedback/service/feedback.service";

@Module({
  imports: [TypeOrmModule.forFeature([FeedbackRepository, RusCaseRepository])],
  controllers: [FeedbackController],
  providers: [CreateFeedbackService, FeedbackService],
})
export class FeedbackModule {}
