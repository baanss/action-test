import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InstallerModule } from "@src/installer/installer.module";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { RusCaseModule } from "@src/rus-case/rus-case.module";
import { UpdateLogModule } from "@src/update-log/update-log.module";
import { RusAppController } from "@src/rus-app/rus-app.controller";

@Module({
  imports: [RusCaseModule, InstallerModule, UpdateLogModule, TypeOrmModule.forFeature([RusCaseRepository])],
  controllers: [RusAppController],
})
export class RusAppModule {}
