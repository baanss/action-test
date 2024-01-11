import { EntityRepository, ObjectLiteral, Repository } from "typeorm";
import { Recipient } from "@src/common/entity/recipient.entity";

import { CreateRecipientsRepositoryReq } from "@src/recipient/dto";

@EntityRepository(Recipient)
export class RecipientRepository extends Repository<Recipient> {
  getOwnAllAndCount(userId: number): Promise<[Recipient[], number]> {
    const queryBuilder = this.createQueryBuilder("recipient").where("recipient.userId = :userId", { userId });

    queryBuilder.addOrderBy("recipient.createdAt", "ASC");
    return queryBuilder.getManyAndCount();
  }

  async createMany(userId: number, createRecipientsRepositoryReqs: CreateRecipientsRepositoryReq[]): Promise<number[]> {
    const queryBuilder = this.createQueryBuilder("recipient");

    const insertValues = createRecipientsRepositoryReqs.map((req) => ({
      userId,
      email: req.email,
      isDefault: req.isDefault,
    }));

    return queryBuilder
      .insert()
      .into(Recipient)
      .values(insertValues)
      .execute()
      .then((insertResult) => insertResult.identifiers?.map((identifier: ObjectLiteral) => identifier.id));
  }

  async deleteAllByUserId(userId: number): Promise<number> {
    const { affected } = await this.delete({ userId });
    return affected;
  }
}
