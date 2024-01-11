import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testUsers } from "@root/seeding/seeder/seed/user.seed";
import { generateNestApplication } from "@test/util/test.util";
import { OrderQuery, UploadJobStatus } from "@src/common/constant/enum.constant";
import { UploadJobService } from "@src/upload-job/service/upload-job.service";
import { UserRepository } from "@src/user/repository/user.repository";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { testUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";
import { UploadJob } from "@src/common/entity/upload-job.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

let app: INestApplication;
let seederService: SeederService;
let uploadJobService: UploadJobService;
let userRepository: UserRepository;
let uploadJobRepository: UploadJobRepository;
const serverCode = process.env.SERVER_CODE;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  uploadJobService = app.get(UploadJobService);

  userRepository = app.get(UserRepository);
  uploadJobRepository = app.get(UploadJobRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("UploadJobService", () => {
  describe("기본값 설정", () => {
    beforeEach(async () => {
      await seederService.empty();
      await userRepository.save(testUsers);
    });

    test("로컬 업로드", async () => {
      // given
      const uploadJobDto = { aeMode: null };

      // when
      const result = await uploadJobService.createOne(uploadJobDto);

      // then
      const expectedResult = { id: expect.any(Number), huId: expect.any(String) };
      expect(result).toEqual(expectedResult);
      const uploadJob = await uploadJobRepository.findOne(result.id);
      expect(uploadJob.huId).toBe(result.huId);
      expect(uploadJob.status).toBe(UploadJobStatus.IN_PROGRESS);
      expect(uploadJob.message).toBeNull();
      expect(uploadJob.studyId).toBeNull();
      expect(uploadJob.isAquired).toBeFalsy();
      expect(uploadJob.studyInstanceUID).toBeNull();
      expect(uploadJob.instancesCount).toBeNull();
      expect(uploadJob.patientId).toBeNull();
      expect(uploadJob.patientName).toBeNull();
      expect(uploadJob.sex).toBeNull();
      expect(uploadJob.age).toBe(0);
    });
  });

  describe("create - uploadJob 데이터 없을 때", () => {
    beforeEach(async () => {
      await seederService.empty();
      await userRepository.save(testUsers);
    });

    test("로컬 업로드 - huId 기본값 설정", async () => {
      // given

      // when
      const uploadJobDto = { aeMode: null, userId: testUsers[0].id };
      const uploadJob = await uploadJobService.createOne(uploadJobDto);

      // then
      const expectedHuId = `${process.env.SERVER_CODE}_${process.env.HUID_START_INDEX}`;
      expect(uploadJob.huId).toBe(expectedHuId);
    });
  });

  describe("create - uploadJob 데이터 있을 때", () => {
    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();
    });

    test("로컬 업로드 - huId 연속값 설정", async () => {
      // given

      // when
      const uploadJobDto = { aeMode: null, userId: testUsers[0].id };
      const uploadJob = await uploadJobService.createOne(uploadJobDto);

      // then
      const uploadJobWithLatestHuId = await uploadJobRepository.getOneByServerCode({ order: OrderQuery.DESC, serverCode });
      expect(uploadJob.huId).toBe(uploadJobWithLatestHuId?.huId);
    });
  });

  describe("encryptAll", () => {
    test("전체 암호화 성공", async () => {
      // given
      await seederService.empty();
      await seederService.seed();

      // when
      const result = await uploadJobService.encryptAll();

      // then: 전체 수정 검사
      expect(result.affected).toBe(testUploadJobs.length);

      // then: 복호화 처리 검사
      const [uploadJobs, count] = await uploadJobRepository.getAllAndCount();
      uploadJobs.forEach((uploadJob: UploadJob, i: number) => {
        expect(uploadJob.patientId).not.toBe(testUploadJobs[i].patientId);
        expect(uploadJob.patientName).not.toBe(testUploadJobs[i].patientName);
      });
    });

    test("성공 - 모든 patientId, patientName 값이 null인 경우, 암호화 요청 무시", async () => {
      // given
      await seederService.empty();
      await seederService.seed();
      const [uploadJobs, count] = await uploadJobRepository.getAllAndCount();
      const uploadJobIds = uploadJobs.map((uploadJob) => uploadJob.id);
      await uploadJobRepository.update(uploadJobIds, { patientId: null, patientName: null });

      // when
      const response = await uploadJobService.encryptAll();

      // then
      const expectedResult = { affected: expect.any(Number) };
      expect(response).toEqual(expectedResult);
    });

    test("성공 - patientId, patientName 값이 null이 아닌 케이스가 하나라도 존재하는 경우, 암호화 요청 성공", async () => {
      // given
      await seederService.empty();
      await seederService.seed();
      const [uploadJobs, count] = await uploadJobRepository.getAllAndCount();
      const uploadJobIds = uploadJobs.map((uploadJob) => uploadJob.id);
      await uploadJobRepository.update(uploadJobIds, { patientId: null, patientName: null });
      const prevPatientInfo = { patientId: "patient-id", patientName: "patient-name" };
      await uploadJobRepository.update(uploadJobIds.at(-1), prevPatientInfo);

      // when
      const response = await uploadJobService.encryptAll();

      // then
      const expectedResult = { affected: expect.any(Number) };
      expect(response).toEqual(expectedResult);

      const postUploadJob = await uploadJobRepository.findOne(uploadJobIds.at(-1));
      expect(postUploadJob.patientId).not.toBe(prevPatientInfo.patientId);
      expect(postUploadJob.patientName).not.toBe(prevPatientInfo.patientName);
    });

    test("BAD_REQUEST - 암호화 중복 요청 불가", async () => {
      // given
      await seederService.empty();
      await seederService.seed();
      await uploadJobService.encryptAll();

      // when
      // then
      await uploadJobService
        .encryptAll()
        .catch(({ response }) => {
          expect(response.error).toBe(HutomHttpException.BAD_REQUEST.error);
        })
        .then((response) => {
          expect(response).toBeUndefined();
        });
    });
  });

  describe("decryptAll", () => {
    test("전체 복호화 성공", async () => {
      // given
      await seederService.empty();
      await seederService.seedEncryption();

      // when
      const result = await uploadJobService.decryptAll();

      // then: 전체 수정 검사
      expect(result.affected).toBe(testUploadJobs.length);

      // then: 복호화 처리 검사
      const [uploadJobs, count] = await uploadJobRepository.getAllAndCount();
      uploadJobs.forEach((uploadJob: UploadJob, i: number) => {
        expect(uploadJob.patientId).toBe(testUploadJobs[i].patientId);
        expect(uploadJob.patientName).toBe(testUploadJobs[i].patientName);
      });
    });

    test("CRYPTO_ERROR, 평문 복호화 실패", async () => {
      // given: 평문 저장
      await seederService.empty();
      await seederService.seed();

      // when - then
      await uploadJobService.decryptAll().catch(({ response }) => {
        expect(response.error).toBe(HutomHttpException.CRYPTO_ERROR.error);
      });
    });
  });
});
