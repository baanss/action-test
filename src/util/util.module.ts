import { Global, Module } from "@nestjs/common";
import { UtilService } from "@src/util/util.service";

@Global()
@Module({
  providers: [UtilService],
  exports: [UtilService],
})
export class UtilModule {}
