import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SeederModule } from "@root/seeding/seeder/seeder.module";
import configuration, { DatabaseConfig, NodeEnv, ServerConfig } from "@src/common/config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const serverConfig = configService.get<ServerConfig>("server");
        const dbConfig = configService.get<DatabaseConfig>("database");
        return {
          type: "postgres",
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [__dirname + "/../**/*.entity{.ts,.js}"],
          synchronize: serverConfig.nodeEnv === NodeEnv.DEV ? true : false,
        };
      },
    }),
    SeederModule,
  ],
})
export class InsertModule {}
