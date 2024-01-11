import { HttpException, Injectable } from "@nestjs/common";
import { SurgeonRepository } from "@src/surgeon/repository/surgeon.repository";
import { GetAllSurgeonServiceReq, PatchSrugeonServiceBodyReq } from "@src/surgeon/dto";
import { Surgeon } from "@src/common/entity/surgeon.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

@Injectable()
export class SurgeonService {
  constructor(private readonly surgoneRepository: SurgeonRepository) {}

  async createOne(name: string): Promise<{ id: number }> {
    const id = await this.surgoneRepository.createOne(name);
    return { id };
  }

  async getManyAndCount(condition: GetAllSurgeonServiceReq): Promise<[Surgeon[], number]> {
    return await this.surgoneRepository.getManyAndCount(condition);
  }

  async getOneById(id: number): Promise<Surgeon> {
    const surgeon = await this.surgoneRepository.getOneById(id);
    if (!surgeon) {
      throw new HttpException(HutomHttpException.NOT_FOUND_DATA, HutomHttpException.NOT_FOUND_DATA.statusCode);
    }
    return surgeon;
  }

  async updateOneById(id: number, body: PatchSrugeonServiceBodyReq): Promise<{ id: number }> {
    await this.surgoneRepository.updateOneById(id, body);
    return { id };
  }

  async deleteMany(ids: number[]): Promise<{ affected: number }> {
    const result = await this.surgoneRepository.deleteMany(ids);
    return { affected: result.affected };
  }
}
