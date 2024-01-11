import { Cache } from "cache-manager";
import { Injectable, Inject, CACHE_MANAGER } from "@nestjs/common";

import { RedisFlag } from "@src/cache/constant/enum.constant";

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get(key: RedisFlag): Promise<any> {
    return await this.cache.get(key);
  }

  async set(key: RedisFlag, value: any, option?: any) {
    await this.cache.set(key, value, option);
  }

  async reset() {
    await this.cache.reset();
  }

  async del(key: RedisFlag) {
    await this.cache.del(key);
  }
}
