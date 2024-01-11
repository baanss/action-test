import { EntityRepository, Repository } from "typeorm";
import { Application } from "@src/common/entity/application.entity";

import { CreateApplicationRepositoryReq, GetAllApplicationRepositoryReq } from "@src/application/dto";

@EntityRepository(Application)
export class ApplicationRepository extends Repository<Application> {
  async createOne(dto: CreateApplicationRepositoryReq): Promise<number> {
    return this.insert(dto).then((insertResult) => insertResult.identifiers[0]?.id);
  }

  getManyAndCount(conditions: GetAllApplicationRepositoryReq) {
    const { employeeId, name, page, limit } = conditions;
    const queryBuilder = this.createQueryBuilder("application");

    if (employeeId) {
      queryBuilder.andWhere("application.employeeId ILIKE :employeeId", { employeeId: `%${employeeId}%` });
    }
    if (name) {
      queryBuilder.andWhere("application.name ILIKE :name", { name: `%${name}%` });
    }

    if (limit !== -1) {
      queryBuilder.offset((page - 1) * limit).limit(limit);
    }
    return queryBuilder.orderBy("application.createdAt", "DESC").getManyAndCount();
  }
}
