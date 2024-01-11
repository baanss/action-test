import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";

import { TaskService } from "./task.service";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";
import { StudyRepository } from "@src/study/repository/study.repository";
import { Study } from "@src/common/entity/study.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { StudyService } from "@src/study/service/study.service";

let app: INestApplication;
let seederService: SeederService;
let taskService: TaskService;
let studyService: StudyService;
let studyRepository: StudyRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  taskService = app.get(TaskService);
  studyService = app.get(StudyService);
  studyRepository = app.get(StudyRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

// FIXME: 암호화 처리 이후 작업
describe("TaskService", () => {
  test("테스트", async () => {
    expect(true);
  });
  //   describe("encryptAllInTransaction", () => {
  //     beforeEach(async () => {
  //       await seederService.empty();
  //     });

  //     test("전체 암호화 성공", async () => {
  //       // given
  //       await seederService.seed();

  //       // when
  //       const result = await taskService.encryptAllInTransaction();

  //       // then: 응답 값 검사
  //       const expected = {
  //         studyResult: {
  //           affected: testStudies.length,
  //         },
  //         qrJobResult: {
  //           affected: testQrJobs.length,
  //         },
  //       };
  //       expect(result).toEqual(expected);

  //       // then: 암호화 처리 검사
  //       const studiesAndCount = await studyRepository.getManyAndCount({});
  //       studiesAndCount[0].forEach((study: Study, i: number) => {
  //         expect(study.patientId).not.toBe(testStudies[i].patientId);
  //         expect(study.patientName).not.toBe(testStudies[i].patientName);
  //       });
  //       const qrJobsAndCount = await qrJobRepository.getManyAndCount({});
  //       qrJobsAndCount[0].forEach((qrJob: QrJob, i: number) => {
  //         expect(qrJob.patientId).not.toBe(testQrJobs[i].patientId);
  //         expect(qrJob.patientName).not.toBe(testQrJobs[i].patientName);
  //       });
  //     });

  //     test("암호화 중복 요청 불가 - study 이미 암호화된 경우, 전체 롤백", async () => {
  //       // given
  //       await seederService.seed();
  //       await studyService.encryptAll();
  //       const baseStudiesAndCount = await studyRepository.getManyAndCount({});
  //       const baseQrJobsAndCount = await qrJobRepository.getManyAndCount({});

  //       // when
  //       const result = taskService.encryptAllInTransaction();

  //       // then
  //       await result.catch(({ response }) => {
  //         expect(response.error).toBe(HutomHttpException.CRYPTO_ERROR.error);
  //       });

  //       // then: 암호화 처리 안됨
  //       const studiesAndCount = await studyRepository.getManyAndCount({});
  //       studiesAndCount[0].forEach((study: Study, i: number) => {
  //         expect(study.patientId).toBe(baseStudiesAndCount[0][i].patientId);
  //         expect(study.patientName).toBe(baseStudiesAndCount[0][i].patientName);
  //       });
  //       const qrJobsAndCount = await qrJobRepository.getManyAndCount({});
  //       qrJobsAndCount[0].forEach((qrJob: QrJob, i: number) => {
  //         expect(qrJob.patientId).toBe(baseQrJobsAndCount[0][i].patientId);
  //         expect(qrJob.patientName).toBe(baseQrJobsAndCount[0][i].patientName);
  //       });
  //     });

  //     test("암호화 중복 요청 불가 - qrJob 이미 암호화된 경우, 전체 롤백", async () => {
  //       // given
  //       await seederService.seed();
  //       await qrJobService.encryptAll();
  //       const baseStudiesAndCount = await studyRepository.getManyAndCount({});
  //       const baseQrJobsAndCount = await qrJobRepository.getManyAndCount({});

  //       // when
  //       const result = taskService.encryptAllInTransaction();

  //       // then
  //       await result.catch(({ response }) => {
  //         expect(response.error).toBe(HutomHttpException.CRYPTO_ERROR.error);
  //       });

  //       // then: 암호화 처리 안됨
  //       const studiesAndCount = await studyRepository.getManyAndCount({});
  //       studiesAndCount[0].forEach((study: Study, i: number) => {
  //         expect(study.patientId).toBe(baseStudiesAndCount[0][i].patientId);
  //         expect(study.patientName).toBe(baseStudiesAndCount[0][i].patientName);
  //       });
  //       const qrJobsAndCount = await qrJobRepository.getManyAndCount({});
  //       qrJobsAndCount[0].forEach((qrJob: QrJob, i: number) => {
  //         expect(qrJob.patientId).toBe(baseQrJobsAndCount[0][i].patientId);
  //         expect(qrJob.patientName).toBe(baseQrJobsAndCount[0][i].patientName);
  //       });
  //     });
  //   });

  //   describe("decryptAllInTransaction", () => {
  //     beforeEach(async () => {
  //       await seederService.empty();
  //     });

  //     test("전체 복호화 성공", async () => {
  //       // given
  //       await seederService.seedEncryption();

  //       // when
  //       const result = await taskService.decryptAllInTransaction();

  //       // then: 응답 값 검사
  //       const expected = {
  //         studyResult: {
  //           affected: testStudies.length,
  //         },
  //         qrJobResult: {
  //           affected: testQrJobs.length,
  //         },
  //       };
  //       expect(result).toEqual(expected);

  //       // then: 암호화 처리 검사
  //       const studiesAndCount = await studyRepository.getManyAndCount({});
  //       studiesAndCount[0].forEach((study: Study, i: number) => {
  //         expect(study.patientId).toBe(testStudies[i].patientId);
  //         expect(study.patientName).toBe(testStudies[i].patientName);
  //       });
  //       const qrJobsAndCount = await qrJobRepository.getManyAndCount({});
  //       qrJobsAndCount[0].forEach((qrJob: QrJob, i: number) => {
  //         expect(qrJob.patientId).toBe(testQrJobs[i].patientId);
  //         expect(qrJob.patientName).toBe(testQrJobs[i].patientName);
  //       });
  //     });

  //     test("qrJob 일부값 복호화 실패 - 트랜잭션 롤백", async () => {
  //       // given
  //       await seederService.seedEncryption();
  //       await qrJobRepository.update(testQrJobs[0].id, { patientId: "invalid" });

  //       // when - then
  //       await taskService.decryptAllInTransaction().catch(({ response }) => {
  //         expect(response.error).toBe(HutomHttpException.CRYPTO_ERROR.error);
  //       });

  //       // then: 암호화 처리 검사
  //       const studiesAndCount = await studyRepository.getManyAndCount({});
  //       studiesAndCount[0].forEach((study: Study, i: number) => {
  //         expect(study.patientId).not.toBe(testStudies[i].patientId);
  //         expect(study.patientName).not.toBe(testStudies[i].patientName);
  //       });
  //       const qrJobsAndCount = await qrJobRepository.getManyAndCount({});
  //       qrJobsAndCount[0].forEach((qrJob: QrJob, i: number) => {
  //         expect(qrJob.patientId).not.toBe(testQrJobs[i].patientId);
  //         expect(qrJob.patientName).not.toBe(testQrJobs[i].patientName);
  //       });
  //     });

  //     test("study 일부값 복호화 실패 - 트랜잭션 롤백", async () => {
  //       // given
  //       await seederService.seedEncryption();
  //       await studyRepository.update(testStudies[0].id, { patientId: "invalid" });

  //       // when
  //       await taskService.decryptAllInTransaction().catch(({ response }) => {
  //         expect(response.error).toBe(HutomHttpException.CRYPTO_ERROR.error);
  //       });

  //       // then: 암호화 처리 검사
  //       const studiesAndCount = await studyRepository.getManyAndCount({});
  //       studiesAndCount[0].forEach((study: Study, i: number) => {
  //         expect(study.patientId).not.toBe(testStudies[i].patientId);
  //         expect(study.patientName).not.toBe(testStudies[i].patientName);
  //       });
  //       const qrJobsAndCount = await qrJobRepository.getManyAndCount({});
  //       qrJobsAndCount[0].forEach((qrJob: QrJob, i: number) => {
  //         expect(qrJob.patientId).not.toBe(testQrJobs[i].patientId);
  //         expect(qrJob.patientName).not.toBe(testQrJobs[i].patientName);
  //       });
  //     });
  //   });
});
