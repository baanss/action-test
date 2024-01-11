import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { InsertModule } from "@root/seeding/insert.module";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { ServerConfig } from "@src/common/config/configuration";

async function bootstrap() {
  const insertApp = await NestFactory.create(InsertModule);

  const configService = insertApp.get<ConfigService>(ConfigService);
  const { encryptionMode } = configService.get<ServerConfig>("server");

  const seederService = insertApp.get(SeederService);
  await seederService.empty();

  if (encryptionMode) {
    await seederService.seedEncryption();
  } else {
    await seederService.seed();
  }

  console.log("Development data inserted!");
  insertApp.close();
}
bootstrap();
