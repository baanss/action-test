import { EntityRepository, Repository } from "typeorm";
import { HttpException } from "@nestjs/common";
import { ClinicalInfo } from "@src/common/entity/clinical-info.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CreateClinicalInfoRepositoryReq } from "@src/rus-case/dto";

@EntityRepository(ClinicalInfo)
export class ClinicalInfoRepository extends Repository<ClinicalInfo> {
  async createOne(dto: CreateClinicalInfoRepositoryReq): Promise<number> {
    return this.insert(dto).then((insertResult) => insertResult.identifiers[0]?.id);
  }

  async updateOneByRusCaseId(rusCaseId: number, values: { operationDate: string | null; deliveryDate: string }): Promise<ClinicalInfo> {
    const updateResult = await this.createQueryBuilder().update().set(values).where("rusCaseId = :rusCaseId", { rusCaseId }).returning(["id"]).execute();
    if (!updateResult?.affected) {
      throw new HttpException(HutomHttpException.UPDATE_DATA_ERROR, HutomHttpException.UPDATE_DATA_ERROR.statusCode);
    }
    return updateResult.raw[0];
  }
}
