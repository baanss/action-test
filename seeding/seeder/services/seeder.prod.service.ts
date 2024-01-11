import { Connection } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { prodAdmins, prodUsers } from "@root/seeding/seeder/seed/prod.seed";

import { User } from "@src/common/entity/user.entity";
import { UtilService } from "@src/util/util.service";
import { ServerConfig } from "@src/common/config/configuration";

@Injectable()
export class ProdSeederService {
  private serverConfig: ServerConfig;
  constructor(private readonly configService: ConfigService, private readonly connection: Connection, private readonly utilService: UtilService) {
    this.serverConfig = this.configService.get<ServerConfig>("server");
  }

  async seedTestData(): Promise<void> {
    if (!this.serverConfig.seedDataMode) {
      console.log("Production data not requested.");
      return;
    }
    const user = await this.connection.getRepository(User).findOne();
    if (user) {
      console.log("Production data already inserted.");
      return;
    }
    const usersToSave = await Promise.all(
      [...prodAdmins, ...prodUsers].map(async (user) => {
        // 비밀번호 암호화
        const hashedPassword = await this.utilService.hashString(user.password);
        return { ...user, password: hashedPassword };
      }),
    );
    await this.connection.createQueryBuilder().insert().into(User).values(usersToSave).orIgnore().execute();
    console.log("Production data inserted!");
  }
}
