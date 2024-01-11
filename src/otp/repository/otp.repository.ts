import * as moment from "moment";
import { EntityRepository, Repository } from "typeorm";
import { OTP } from "@src/common/entity/otp.entity";

@EntityRepository(OTP)
export class OtpRepository extends Repository<OTP> {
  getOneByToken(token: string): Promise<OTP> {
    return this.createQueryBuilder("otp").select("otp").innerJoinAndSelect("otp.user", "user").where("otp.token = :token", { token }).getOne();
  }

  async upsertOne(dto: { userId: number; token: string; hasExpiresIn?: boolean }): Promise<{ id: number }> {
    const { userId, token, hasExpiresIn = false } = dto;
    const expiresIn = hasExpiresIn ? moment().add(24, "h") : moment().add(999, "y");

    return await this.upsert({ userId, token, expiresIn }, { conflictPaths: ["userId"] }).then((insertResult) => {
      return { id: insertResult.identifiers[0]?.id };
    });
  }
}
