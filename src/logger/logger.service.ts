import * as winston from "winston";
import * as moment from "moment-timezone";
import * as path from "path";
import { Injectable, LoggerService as LS } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as DailyRotateFile from "winston-daily-rotate-file";
import { CoreConfig, NodeEnv, ServerConfig } from "@src/common/config/configuration";
import { LogType, ServiceType } from "@src/common/constant/enum.constant";

const { errors, printf, splat, colorize, prettyPrint } = winston.format;

const myFormat = printf((info) => {
  const { timestamp, level, message } = info;
  if (typeof info.message === "object") {
    info.message = JSON.stringify(info.message, null, 2);
  }
  return `${timestamp} ${level}: ${message}`;
});
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  access: 6,
};
const levelFilter = (level) =>
  winston.format((info) => {
    if (info.level === level) {
      return info;
    }
  })();
@Injectable()
export class LoggerService implements LS {
  private logger: winston.Logger;

  constructor(configService: ConfigService) {
    const { nodeEnv, timezone } = configService.get<ServerConfig>("server");
    const { logPath } = configService.get<CoreConfig>("core");

    const timestamptz = () => {
      return moment(new Date()).tz(timezone).format();
    };

    if (nodeEnv === NodeEnv.PROD) {
      this.logger = winston.createLogger({
        levels: customLevels,
        format: winston.format.combine(splat(), winston.format.timestamp({ format: timestamptz }), myFormat),
        transports: [
          new winston.transports.Console({
            level: "debug",
            handleExceptions: true,
            format: winston.format.combine(
              errors({ stack: true }),
              colorize(),
              splat(),
              prettyPrint(),
              winston.format.timestamp({ format: timestamptz }),
              myFormat,
            ),
          }),
          new winston.transports.File({
            level: "error",
            dirname: path.join(logPath, "error"),
            filename: `error-${moment(new Date()).format("YYYY-MM-DD")}.log`,
            maxsize: 5000000,
          }),
          new winston.transports.File({
            level: "http",
            dirname: path.join(logPath, "info"),
            filename: `info-${moment(new Date()).format("YYYY-MM-DD")}.log`,
            maxsize: 5000000,
          }),
          new DailyRotateFile({
            dirname: path.join(logPath, "access", "daily"),
            filename: "%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: false,
            maxSize: "30m", // Maximum log file size before rotation
            maxFiles: "1095d", // Retain logs for 3 years
            level: "access",
            format: winston.format.combine(levelFilter("access")),
          }),
        ],
      });
    } else {
      this.logger = winston.createLogger({
        format: winston.format.combine(splat(), winston.format.timestamp({ format: timestamptz }), myFormat),
        level: "debug",
        levels: customLevels,
        transports: [
          new winston.transports.Console({
            level: "debug",
            handleExceptions: true,
            format: winston.format.combine(
              errors({ stack: true }),
              colorize(),
              splat(),
              prettyPrint(),
              winston.format.timestamp({ format: timestamptz }),
              myFormat,
            ),
          }),
        ],
      });
    }

    console.log = (message: any, params?: any) => {
      this.logger.debug(message, params);
    };

    console.info = (message: any, params?: any) => {
      this.logger.log(message, params);
    };

    console.warn = (message: any, params?: any) => {
      this.logger.log(message, params);
    };
  }

  log(serviceType: ServiceType, employeeId: string, logType: LogType, params?: string) {
    this.logger.info(`[LOG][${serviceType}] ${employeeId ?? "-"}, ${logType}, ${params ?? "-"}`);
  }

  error(message: string, trace: string) {
    this.logger.error(message, trace);
  }
  warn(message: string) {
    this.logger.warning(message);
  }
  debug(message: string) {
    this.logger.debug(message);
  }
  verbose(message: string) {
    this.logger.verbose(message);
  }
  access(serviceType: ServiceType, employeeId: string, logType: LogType, params?: string) {
    this.logger.log("access", `[ACCESS][${serviceType}] ${employeeId ?? "-"}, ${logType}, ${params ?? "-"}`);
  }
}
