import { EntityRepository, Repository, UpdateResult } from "typeorm";
import { HttpException } from "@nestjs/common";

import { Hu3d } from "@src/common/entity/hu3d.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CreateHu3dRepositoryReq, UpdateHu3dRepositoryReq } from "@src/rus-case/dto";

@EntityRepository(Hu3d)
export class Hu3dRepository extends Repository<Hu3d> {
  // 하나 생성하기
  async createOne(dto: CreateHu3dRepositoryReq): Promise<{ id: number }> {
    const { rusCaseId, filePath, fileName, fileSize } = dto;
    const result = await this.insert({ rusCaseId, filePath, fileName, fileSize, version: 1 });
    return { id: result.identifiers[0].id };
  }

  // 하나 가져오기(studyId 기준)
  getOneByStudyId(studyId: number): Promise<Hu3d> {
    return this.createQueryBuilder("hu3d").select("hu3d").innerJoin("hu3d.rusCase", "rusCase").where("rusCase.studyId = :studyId", { studyId }).getOne();
  }

  // 하나 수정하기
  async updateOne(id: number, values: UpdateHu3dRepositoryReq): Promise<{ id: number }> {
    return await this.update(id, values).then((updateResult) => {
      if (updateResult.affected) {
        return { id };
      }
      throw new HttpException(HutomHttpException.UPDATE_DATA_ERROR, HutomHttpException.UPDATE_DATA_ERROR.statusCode);
    });
  }

  // 파일 삭제하기
  deleteFileById(id: number): Promise<UpdateResult> {
    return this.update(id, { filePath: null, fileSize: 0, version: null });
  }
}
