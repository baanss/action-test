import { EntityRepository, Repository } from "typeorm";
import { HttpException } from "@nestjs/common";
import { Surgeon } from "@src/common/entity/surgeon.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { GetAllSurgeonRepositoryReq, PatchSrugeonRepositoryBodyReq } from "@src/surgeon/dto";

@EntityRepository(Surgeon)
export class SurgeonRepository extends Repository<Surgeon> {
  async createOne(name: string): Promise<number> {
    return await this.insert({ name })
      .then((insertResult) => insertResult.identifiers[0].id)
      .catch((error) => {
        if (error.code === "23505") {
          throw new HttpException(HutomHttpException.DUPLICATED_DATA, HutomHttpException.DUPLICATED_DATA.statusCode);
        }
        throw error;
      });
  }

  async getManyAndCount(condition: GetAllSurgeonRepositoryReq): Promise<[Surgeon[], number]> {
    const { page, limit } = condition;
    const query = this.createQueryBuilder("surgeon").select("surgeon");
    if (limit !== -1) {
      query.offset((page - 1) * limit).limit(limit);
    }
    return query.orderBy("surgeon.name", "ASC").getManyAndCount();
  }

  async getOneById(id: number): Promise<Surgeon | null> {
    return this.findOne(id).then((result) => (result ? result : null));
  }

  async updateOneById(id: number, body: PatchSrugeonRepositoryBodyReq): Promise<void> {
    return await this.update(id, body)
      .then((updateResult) => {
        if (updateResult.affected) {
          return;
        }
        throw new HttpException(HutomHttpException.UPDATE_DATA_ERROR, HutomHttpException.UPDATE_DATA_ERROR.statusCode);
      })
      .catch((error) => {
        if (error.code === "23505") {
          throw new HttpException(HutomHttpException.DUPLICATED_DATA, HutomHttpException.DUPLICATED_DATA.statusCode);
        }
        throw error;
      });
  }

  async deleteMany(ids: number[]): Promise<{ affected: number }> {
    return await this.delete(ids).then((deleteResult) => {
      return { affected: deleteResult.affected };
    });
  }
}
