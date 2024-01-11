import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UploadJobService } from "@src/upload-job/service/upload-job.service";
import { UploadJobController } from "@src/upload-job/upload-job.controller";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { UploadJobViewRepository } from "@src/upload-job/repository/upload-job.view.repository";
import { UploadJobViewService } from "@src/upload-job/service/upload-job.view.service";

@Module({
  imports: [TypeOrmModule.forFeature([UploadJobRepository, UploadJobViewRepository])],
  controllers: [UploadJobController],
  providers: [UploadJobService, UploadJobViewService],
  exports: [UploadJobService],
})
export class UploadJobModule {}
