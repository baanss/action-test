import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { QrService } from "@src/qr/service/qr.service";
import { QrController } from "@src/qr/qr.controller";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { UploadJobModule } from "@src/upload-job/upload-job.module";
@Module({
  imports: [HttpModule, UploadJobModule, TypeOrmModule.forFeature([UploadJobRepository])],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
