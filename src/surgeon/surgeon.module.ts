import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SurgeonRepository } from "@src/surgeon/repository/surgeon.repository";
import { SurgeonController } from "@src/surgeon/surgeon.controller";
import { SurgeonService } from "@src/surgeon/service/surgeon.service";

@Module({
  imports: [TypeOrmModule.forFeature([SurgeonRepository])],
  controllers: [SurgeonController],
  providers: [SurgeonService],
})
export class SurgeonModule {}
