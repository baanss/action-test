import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InstallerController } from "@src/installer/installer.controller";
import { InstallerRepository } from "@src/installer/repository/installer.repository";
import { InstallerService } from "@src/installer/service/installer.service";
import { CreateInstallerSerivce } from "@src/installer/service/create-installer.service";

@Module({
  imports: [TypeOrmModule.forFeature([InstallerRepository])],
  controllers: [InstallerController],
  providers: [InstallerService, CreateInstallerSerivce],
  exports: [InstallerService],
})
export class InstallerModule {}
