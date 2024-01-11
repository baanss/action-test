import * as path from "path";
import * as winston from "winston";
import * as moment from "moment-timezone";
import { WinstonModule } from "nest-winston";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { CoreConfig, NodeEnv, ServerConfig } from "@src/common/config/configuration";
import { LoggerService } from "@src/logger/logger.service";

const { timestamp, printf, splat, prettyPrint } = winston.format;
const myFormat = printf(({ timestamp, level, request = "[LOG]", message }) => `${timestamp} ${level}: ${request} ${message}`);

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { nodeEnv, timezone } = configService.get<ServerConfig>("server");
        const { logPath } = configService.get<CoreConfig>("core");

        const timestamptz = () => {
          return moment(new Date()).tz(timezone).format();
        };

        if (nodeEnv === NodeEnv.PROD) {
          return {
            transports: [
              new winston.transports.Console({
                level: "debug",
                format: winston.format.combine(
                  winston.format.timestamp({
                    format: timestamptz,
                  }),
                  myFormat,
                ),
              }),
              new winston.transports.File({
                level: "error",
                dirname: path.join(logPath, "error"),
                filename: `error-${moment(new Date()).format("YYYY-MM-DD")}.log`,
                format: winston.format.combine(splat(), prettyPrint(), timestamp({ format: timestamptz }), myFormat),
                maxsize: 5000000,
              }),
              new winston.transports.File({
                level: "info",
                dirname: path.join(logPath, "info"),
                filename: `info-${moment(new Date()).format("YYYY-MM-DD")}.log`,
                format: winston.format.combine(
                  splat(),
                  prettyPrint(),
                  winston.format.timestamp({
                    format: timestamptz,
                  }),
                  myFormat,
                ),
                maxsize: 5000000,
              }),
            ],
          };
        } else {
          return {
            level: "debug",
            transports: [
              new winston.transports.Console({
                level: "debug",
                format: winston.format.combine(
                  winston.format.timestamp({
                    format: timestamptz,
                  }),
                  myFormat,
                ),
              }),
            ],
          };
        }
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
