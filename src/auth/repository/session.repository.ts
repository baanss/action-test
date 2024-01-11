import { Session } from "@src/common/entity/session.entity";
import { EntityRepository, Repository } from "typeorm";

@EntityRepository(Session)
export class SessionRepository extends Repository<Session> {
  findOneByUserId(userId: number): Promise<Session> {
    return this.findOne({
      where: { user: { id: userId } },
    });
  }

  async deleteOne(condition: { id?: number; userId?: number }): Promise<void> {
    await this.delete(condition);
  }
}
