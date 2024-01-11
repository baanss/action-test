import * as path from "path";
import * as dotenv from "dotenv";
import { RusServiceCode } from "@src/common/middleware/user-auth.middleware";

dotenv.config();

export enum NodeEnv {
  PROD = "production",
  DEV = "development",
}

export enum EncryptionEnum {
  ON = "on",
  OFF = "off",
}

export enum SeedDataEnum {
  ON = "on",
  OFF = "off",
}

export interface ServerConfig {
  nodeEnv: NodeEnv;
  host: string;
  port: number;
  serverUrl: string;
  redirectUrl: string;
  originDomain: string;
  appVersion: string;
  timezone: string;
  encryptionMode: boolean;
  seedDataMode: boolean;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  redisHost: string;
}

export interface AuthConfig {
  passwordSalt: string;
  jwtSecret: string;
  secretKey: string;
  jwtExpiresIn: string;
}

export interface CoreConfig {
  serverCode: string;
  serviceCode: string;
  logPath: string;
  storagePath: string;
  dicomPath: string;
  hu3dPath: string;
  etcPath: string;
  huIdStartIndex: number;
  adminEmail: string;
}

export interface CloudConfig {
  hcloudServerUrl: string;
  signedCertPath: string;
  signedKeyPath: string;
}

export interface SwaggerConfig {
  username: string;
  password: string;
}

export interface QrConfig {
  serverUrl: string;
  timeoutMs: number;
  maxCount: number;
}

export interface PacsConfig {
  serverHost: string;
  serverPort: string;
  serverAet: string;
}

export interface QaConfig {
  diskFreeSpace: string;
}

export default () => ({
  server: {
    nodeEnv: process.env.NODE_ENV || NodeEnv.DEV,
    host: process.env.SERVER_HOST || "localhost",
    port: parseInt(process.env.SERVER_PORT, 10) || 3000,
    serverUrl: process.env.SERVER_URL || "http://localhost:3000",
    redirectUrl: process.env.REDIRECT_URL || "http://localhost:3000",
    originDomain: process.env.ORIGIN_DOMAIN || "http://localhost:3000",
    appVersion: process.env.APP_VERSION || "development",
    timezone: process.env.CLIENT_TZ || "Asia/Seoul",
    encryptionMode: process.env.ENCRYPTION === EncryptionEnum.ON,
    seedDataMode: process.env.SEED_DATA === SeedDataEnum.ON,
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "hserver",
    database: process.env.DB_DATABASE || "hserver",
    redisHost: process.env.REDIS_HOST || "localhost",
  },
  auth: {
    passwordSalt: process.env.SECRET_KEY,
    jwtSecret: process.env.SECRET_KEY,
    secretKey: process.env.SECRET_KEY,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || 1000 * 60 * 30, // NOTE: 30분 => 1800000 밀리초
  },
  core: {
    serverCode: process.env.SERVER_CODE || "D00000ug_sto",
    serviceCode: process.env.SERVICE_CODE || RusServiceCode.STOMACH,
    logPath: process.env.LOG_PATH || path.resolve(`${__dirname}/../../../logs`),
    storagePath: process.env.STORAGE_PATH || path.resolve(`${__dirname}../../../data`),
    dicomPath: path.join(process.env.STORAGE_PATH || path.resolve(`${__dirname}../../../data`), "dicom"),
    hu3dPath: path.join(process.env.STORAGE_PATH || path.resolve(`${__dirname}../../../data`), "hu3d"),
    etcPath: path.join(process.env.STORAGE_PATH || path.resolve(`${__dirname}../../../data`), "etc"),
    huIdStartIndex: process.env.HUID_START_INDEX || 1,
    adminEmail: process.env.ADMIN_EMAIL,
  },
  cloud: {
    hcloudServerUrl: process.env.HCLOUD_SERVER_URL,
    signedCertPath: process.env.SIGNED_CERT_PATH || path.resolve(`${__dirname}/../../../../cert_key/nginx-selfsigned.crt`),
    signedKeyPath: process.env.SIGNED_KEY_PATH || path.resolve(`${__dirname}/../../../../cert_key/nginx-selfsigned.key`),
  },
  qr: {
    serverUrl: process.env.QR_SERVER_URL,
    timeoutMs: parseInt(process.env.QR_TIMEOUT_MS, 10) || 1 * 60 * 60 * 1000, // NOTE: 1h
    maxCount: parseInt(process.env.QR_MAX_COUNT, 10) || 1,
  },
  pacs: {
    serverHost: process.env.PACS_SERVER_HOST,
    serverPort: process.env.PACS_SERVER_PORT,
    serverAet: process.env.PACS_SERVER_AET,
  },
  swagger: {
    username: process.env.SWAGGER_USER,
    password: process.env.SWAGGER_PASSWORD,
  },
  qa: {
    diskFreeSpace: process.env.DISK_FREE_SPACE,
  },
});
