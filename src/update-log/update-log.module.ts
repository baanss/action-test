import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UpdateLogController } from "@src/update-log/update-log.controller";
import { UpdateLogRepository } from "@src/update-log/repository/update-log.repository";
import { UpdateLogService } from "@src/update-log/service/update-log.service";
import { CreateUpdateLogService } from "@src/update-log/service/create-update-log.service";

@Module({
  imports: [TypeOrmModule.forFeature([UpdateLogRepository])],
  controllers: [UpdateLogController],
  providers: [UpdateLogService, CreateUpdateLogService],
  exports: [UpdateLogService],
})
export class UpdateLogModule {}
