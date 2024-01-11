import * as dotenv from "dotenv";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

dotenv.config();

const ormconfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: +process.env.DB_PORT || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "hserver",
  database: process.env.DB_DATABASE || "hserver",
  ssl: false,
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/database/migrations/**/*{.ts,.js}"],
  migrationsTableName: "migrations",
  cli: {
    entitiesDir: __dirname + "/**/*.entity.{js,ts}",
    migrationsDir: __dirname + "/database/migrations/",
  },
};
export default ormconfig;
