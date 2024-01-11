import { EntityRepository, Repository, UpdateResult } from "typeorm";
import { Dicom } from "@src/common/entity/dicom.entity";
import { HttpException } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@EntityRepository(Dicom)
export class DicomRepository extends Repository<Dicom> {
  // 전체 리스트 가져오기
  getManyAndCount(): Promise<[Dicom[], number]> {
    return this.createQueryBuilder("dicom").select("dicom").getManyAndCount();
  }

  // filePath를 가지는 리스트 가져오기
  getManyWithFilePathAndCount(): Promise<[Dicom[], number]> {
    return this.createQueryBuilder("dicom").select("dicom").where("dicom.filePath is not null").getManyAndCount();
  }

  // 하나 가져오기(id 기준)
  getOneById(id: number): Promise<Dicom> {
    return this.createQueryBuilder("dicom").select("dicom").where("dicom.id = :id", { id }).getOne();
  }

  // 하나 가져오기(studyId 기준)
  // 스터디 테이블 조인
  getOneByStudyId(studyId: number): Promise<Dicom> {
    return this.createQueryBuilder("dicom").select("dicom").where("dicom.studyId = :studyId", { studyId }).getOne();
  }

  // 파일 삭제하기
  async deleteFileById(id: number): Promise<UpdateResult> {
    return this.update(id, { filePath: null, fileSize: 0 }).then((updateResult) => {
      if (!updateResult.affected) {
        throw new HttpException(HutomHttpException.UPDATE_DATA_ERROR, HutomHttpException.UPDATE_DATA_ERROR.statusCode);
      }
      return updateResult;
    });
  }
}
