import * as redisStore from "cache-manager-redis-store";
import { CacheModule, Module } from "@nestjs/common";
import { RedisService } from "@src/cache/service/redis.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DatabaseConfig } from "@src/common/config/configuration";

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<DatabaseConfig>("database").redisHost,
        port: 6379,
        ttl: 24 * 60 * 60,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
