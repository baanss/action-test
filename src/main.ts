import * as cookieParser from "cookie-parser";
import * as path from "path";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import * as basicAuth from "express-basic-auth";

import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import {
  CoreConfig,
  ServerConfig,
  SwaggerConfig,
} from "@src/common/config/configuration";
import { AppModule } from "@src/app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get<ConfigService>(ConfigService);
  const { port, originDomain, appVersion } =
    configService.get<ServerConfig>("server");
  const { username, password } = configService.get<SwaggerConfig>("swagger");

  app.enableCors({
    origin: originDomain,
    credentials: true,
    methods: ["GET", "POST", "PATCH"],
  });
  app.use(cookieParser());
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useStaticAssets(
    path.join(configService.get<CoreConfig>("core").etcPath, "profile")
  );
  app.use(
    ["/docs"],
    basicAuth({
      users: { [username]: password },
      challenge: true, // NOTE: 로그인 팝업 뜨도록 함.
    })
  );

  // TODO 함수로 분리
  // Swagger 설정
  // NOTE: Cookie authentication is currently not supported for "try it out" requests due to browser security restrictions
  const swaggerConfig = new DocumentBuilder()
    .setTitle("RUS h-Server")
    .setDescription("RUS h-Server REST API")
    .setVersion(appVersion)
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      description: "Enter JWT token",
      in: "headers",
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "RUS h-Server REST API",
  });

  await app.listen(port);
}

bootstrap();
