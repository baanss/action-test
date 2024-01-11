import { EntityRepository, Repository } from "typeorm";

import { CreditCategory, CreditHistory } from "@src/common/entity/credit-history.entity";

@EntityRepository(CreditHistory)
export class CreditHistoryRepository extends Repository<CreditHistory> {
  findLatestOne(): Promise<CreditHistory> {
    const query = this.createQueryBuilder("ch");

    return query.orderBy("ch.createdAt", "DESC").getOne();
  }

  async createOne(dto: {
    huId: string;
    category: CreditCategory;
    quantity: number;
    isUserRequest: boolean;
    status: boolean;
    employeeId: string;
    name: string;
    userId?: number;
  }): Promise<{ id: number }> {
    const { huId, category, quantity, isUserRequest, status, employeeId, name, userId = null } = dto;
    const result = await this.insert({ huId, category, quantity, isUserRequest, status, employeeId, name, userId });
    return { id: result.identifiers[0].id };
  }

  async updateOne(id: number, dto: { status?: boolean }): Promise<{ affected: number }> {
    const result = await this.update(id, dto);
    return { affected: result.affected };
  }
}
