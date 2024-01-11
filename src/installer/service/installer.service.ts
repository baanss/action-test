import { Injectable } from "@nestjs/common";
import { Installer } from "@src/common/entity/installer.entity";
import { InstallerRepository } from "@src/installer/repository/installer.repository";

@Injectable()
export class InstallerService {
  constructor(private readonly installerRepository: InstallerRepository) {}

  async getLatestOne(): Promise<Installer> {
    // 최신 업로드된 설치파일을 조회한다.
    const installer = await this.installerRepository.getLatestOne();
    return installer;
  }
}
