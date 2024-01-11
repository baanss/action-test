import { EntityRepository, Repository } from "typeorm";
import { Installer } from "@src/common/entity/installer.entity";
import { HttpException } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@EntityRepository(Installer)
export class InstallerRepository extends Repository<Installer> {
  async getLatestOne(): Promise<Installer> {
    return await this.createQueryBuilder("installer").select("installer").orderBy("installer.createdAt", "DESC").getOne();
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
