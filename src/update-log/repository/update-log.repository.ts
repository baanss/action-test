import { EntityRepository, Repository } from "typeorm";
import { HttpException } from "@nestjs/common";
import { UpdateLog } from "@src/common/entity/update-log.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@EntityRepository(UpdateLog)
export class UpdateLogRepository extends Repository<UpdateLog> {
  async getLatestOne(): Promise<UpdateLog> {
    return await this.createQueryBuilder("updateLog").select("updateLog").orderBy("updateLog.createdAt", "DESC").getOne();
  }

  async createOne(dto: { fileName: string; filePath: string; fileSize: number }): Promise<{ id: number }> {
    return await this.insert(dto).then((insertResult) => {
      if (insertResult.identifiers[0]) {
        return { id: insertResult.identifiers[0].id };
      }
      throw new HttpException(HutomHttpException.CREATE_DATA_ERROR, HutomHttpException.CREATE_DATA_ERROR.statusCode);
    });
  }

  async deleteOneById(id: number): Promise<void> {
    return await this.update(id, { filePath: null, fileSize: 0 }).then(() => {
      return;
    });
  }
}
