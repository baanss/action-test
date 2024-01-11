import { NestFactory } from "@nestjs/core";

import { InsertModule } from "@root/seeding/insert.module";
import { ProdSeederService } from "@root/seeding/seeder/services/seeder.prod.service";

async function bootstrap() {
  const insertApp = await NestFactory.create(InsertModule);

  const prodSeederService = insertApp.get(ProdSeederService);
  await prodSeederService.seedTestData();

  await insertApp.close();
}
bootstrap();
