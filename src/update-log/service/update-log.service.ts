import { Injectable } from "@nestjs/common";
import { UpdateLog } from "@src/common/entity/update-log.entity";
import { UpdateLogRepository } from "@src/update-log/repository/update-log.repository";

@Injectable()
export class UpdateLogService {
  constructor(private readonly updateLogRepository: UpdateLogRepository) {}

  async getLatestOne(): Promise<UpdateLog> {
    // 최신 업로드된 설치파일을 조회한다.
    const updateLog = await this.updateLogRepository.getLatestOne();
    return updateLog;
  }
}
