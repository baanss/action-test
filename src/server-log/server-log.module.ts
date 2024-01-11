import { Module } from "@nestjs/common";
import { ServerLogController } from "@src/server-log/server-log.controller";
import { ServerlogService } from "@src/server-log/service/server-log.service";

@Module({
  controllers: [ServerLogController],
  providers: [ServerlogService],
})
export class ServerLogModule {}
