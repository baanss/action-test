import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecipientRepository } from "@src/recipient/repository/recipient.repository";
import { RecipientController } from "@src/recipient/recipient.controller";
import { RecipientService } from "@src/recipient/service/recipient.service";
import { UserModule } from "@src/user/user.module";

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([RecipientRepository])],
  controllers: [RecipientController],
  providers: [RecipientService],
})
export class RecipientModule {}
