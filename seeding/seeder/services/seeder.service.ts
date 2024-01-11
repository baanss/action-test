import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";

import { testUsers, testAdmins } from "@root/seeding/seeder/seed/user.seed";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";
import { testDicoms } from "@root/seeding/seeder/seed/dicom.seed";
import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";
import { testInstallers } from "@root/seeding/seeder/seed/installer.seed";
import { testHu3ds } from "@root/seeding/seeder/seed/hu3d.seed";
import { testClinicalInfos } from "@root/seeding/seeder/seed/clinical-info.seed";
import { testFeedbacks } from "@root/seeding/seeder/seed/feedback.seed";
import { testUpdateLogs } from "@root/seeding/seeder/seed/update-log.seed";
import { testApplications } from "@root/seeding/seeder/seed/application.seed";
import { testUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";
import { testSurgeons } from "@root/seeding/seeder/seed/surgeon.seed";
import { testOtps } from "@root/seeding/seeder/seed/otp.seed";
import { testRecipients } from "@root/seeding/seeder/seed/recipient.seed";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";

import { UtilService } from "@src/util/util.service";

import { User } from "@src/common/entity/user.entity";
import { Application } from "@src/common/entity/application.entity";
import { FeedbackRepository } from "@src/feedback/repository/feedback.repository";
import { InstallerRepository } from "@src/installer/repository/installer.repository";
import { ClinicalInfoRepository } from "@src/rus-case/repository/clinical-info.repository";
import { Hu3dRepository } from "@src/rus-case/repository/hu3d.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { UpdateLogRepository } from "@src/update-log/repository/update-log.repository";
import { StudyRepository } from "@src/study/repository/study.repository";
import { UploadJob } from "@src/common/entity/upload-job.entity";
import { Surgeon } from "@src/common/entity/surgeon.entity";
import { OTP } from "@src/common/entity/otp.entity";
import { Recipient } from "@src/common/entity/recipient.entity";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";

@Injectable()
export class SeederService {
  constructor(
    private readonly connection: Connection,
    private readonly utilService: UtilService,

    private readonly studyRepository: StudyRepository,
    private readonly dicomRepository: DicomRepository,
    private readonly rusCaseRepository: RusCaseRepository,
    private readonly hu3dRepository: Hu3dRepository,
    private readonly clinicalInfoRepository: ClinicalInfoRepository,
    private readonly feedbackRepository: FeedbackRepository,
    private readonly installerRepository: InstallerRepository,
    private readonly updateLogRepository: UpdateLogRepository,
    private readonly creditHistoryRepository: CreditHistoryRepository,
  ) {}

  async empty() {
    const tables = [
      "application",
      "study",
      "dicom",
      "rus_case",
      "hu3d",
      "clinical_info",
      "feedback",
      "installer",
      "update_log",
      "credit_history",
      "notification",
      "upload_job",
      "surgeon",
      "otp",
      "recipient",
      "session",
    ];
    await this.connection.query(`TRUNCATE ${tables.join(", ")} RESTART IDENTITY CASCADE`);
    await this.connection.getRepository(User).delete({});

    // FIXME: TRUNCATE table RESTART IDENTITY -> should sequence id restart from 1
    await this.connection.query(`ALTER SEQUENCE user_id_seq RESTART WITH 1`);
    for (const table of tables) {
      await this.connection.query(`ALTER SEQUENCE ${table}_id_seq RESTART WITH 1`);
    }
  }

  async seed(): Promise<void> {
    // ==========================================================
    // NOTE: patientId, patientName 암호화 모드 비활성화
    // ==========================================================
    const hashedUsers = await Promise.all(
      [...testAdmins, ...testUsers].map(async (user) => {
        const hashedPassword = await this.utilService.hashString(user.password);
        return {
          ...user,
          password: hashedPassword,
        };
      }),
    );
    await this.connection.getRepository(User).save(hashedUsers);

    await this.connection.getRepository(UploadJob).save(testUploadJobs);
    await this.connection.getRepository(Surgeon).save(testSurgeons);
    await Promise.all([this.studyRepository.save(testStudies), this.installerRepository.save(testInstallers), this.updateLogRepository.save(testUpdateLogs)]);
    await Promise.all([this.dicomRepository.save(testDicoms), this.rusCaseRepository.save(testRusCases)]);
    await Promise.all([this.hu3dRepository.save(testHu3ds), this.clinicalInfoRepository.save(testClinicalInfos), this.feedbackRepository.save(testFeedbacks)]);

    await this.connection.getRepository(OTP).save(testOtps);
    await this.connection.getRepository(Recipient).save(testRecipients);
    await this.creditHistoryRepository.save(testCreditHistories);
    await this.connection.getRepository(Application).save(testApplications);
  }

  async seedEncryption(): Promise<void> {
    // ==========================================================
    // NOTE: patientId, patientName 암호화 모드 활성화
    // ==========================================================
    const hashedUsers = await Promise.all(
      [...testAdmins, ...testUsers].map(async (user) => {
        const hashedPassword = await this.utilService.hashString(user.password);
        return {
          ...user,
          password: hashedPassword,
        };
      }),
    );
    await this.connection.getRepository(User).save(hashedUsers);
    await this.connection.getRepository(Surgeon).save(testSurgeons);
    const hashedUploadJobs = await Promise.all(
      testUploadJobs.map(async (testUploadJob) => {
        const encrypted = await this.utilService.encryptPromise({ patientId: testUploadJob.patientId, patientName: testUploadJob.patientName });
        return {
          ...testUploadJob,
          patientId: encrypted.patientId,
          patientName: encrypted.patientName,
        };
      }),
    );
    await this.connection.getRepository(UploadJob).save(hashedUploadJobs);

    const hashedStudies = await Promise.all(
      testStudies.map(async (testStudy) => {
        const encrypted = await this.utilService.encryptPromise({ patientId: testStudy.patientId, patientName: testStudy.patientName });
        return {
          ...testStudy,
          patientId: encrypted.patientId,
          patientName: encrypted.patientName,
        };
      }),
    );

    await Promise.all([this.studyRepository.save(hashedStudies), this.installerRepository.save(testInstallers), this.updateLogRepository.save(testUpdateLogs)]);
    await Promise.all([this.dicomRepository.save(testDicoms), this.rusCaseRepository.save(testRusCases)]);
    await Promise.all([this.hu3dRepository.save(testHu3ds), this.clinicalInfoRepository.save(testClinicalInfos), this.feedbackRepository.save(testFeedbacks)]);

    await this.connection.getRepository(OTP).save(testOtps);
    await this.connection.getRepository(Recipient).save(testRecipients);
    await this.creditHistoryRepository.save(testCreditHistories);
    await this.connection.getRepository(Application).save(testApplications);
  }

  async seedUsers(): Promise<void> {
    const hashedUsers = await Promise.all(
      [...testAdmins, ...testUsers].map(async (user) => {
        const hashedPassword = await this.utilService.hashString(user.password);
        return {
          ...user,
          password: hashedPassword,
        };
      }),
    );
    await this.connection.getRepository(User).save(hashedUsers);
  }
}
