import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { testUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { AeMode } from "@src/common/constant/enum.constant";
import { StudyRepository } from "@src/study/repository/study.repository";

let app: INestApplication;
let seederService: SeederService;

let studyRepository: StudyRepository;
let uploadJobRepository: UploadJobRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  studyRepository = app.get(StudyRepository);
  uploadJobRepository = app.get(UploadJobRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /studies/:id", () => {
  const expectedStudy = {
    id: expect.any(Number),
    huId: expect.any(String),
    patientId: expect.any(String),
    patientName: expect.any(String),
    studyDate: expect.any(String),
    studyDescription: expect.any(String),
    seriesCount: expect.any(Number),
    instancesCount: expect.any(Number),
    createdAt: expect.any(String),
    isRegistered: expect.any(Boolean),
    age: expect.any(Number), // nullable
    sex: expect.any(String), // nullable
  };

  test("UNAUTHORIZED_ORIGIN, 권한 없음", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).get("/studies/1");

    //then
    expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_ORIGIN.error);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testUploadJobs[0].user;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

      const res = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: currentUser.employeeId,
          password: currentUser.password,
        })
        .expect(200);

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("INVALID_REQUEST_PARAMETER, 파라미터가 유효하지 않음", async () => {
      // given
      const invalidParameter = "invalid";

      // when
      const response = await agent.get(`/studies/${invalidParameter}`);

      // then
      expect(response.body.error).toBe(HutomHttpException.INVALID_REQUEST_PARAMETER.error);
    });

    test("NOT_FOUND_STUDY_WITH_ID, study가 존재하지 않음", async () => {
      // given
      const studyId = "999";

      // when
      const res = await agent.get(`/studies/${studyId}`);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_STUDY_WITH_ID.error);
    });

    test("FORBIDDEN_RESOURCE, 자신이 생성하지 않은 경우 조회 불가", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: AeMode.SCU, userId: testUsers[1].id });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(403);

      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });

    test("성공 - 사용자가 존재하지 않는 경우 조회 가능", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: AeMode.SCU, userId: null });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(200);

      // then
      expect(res.body.id).toBe(study.id);
    });

    test("성공 - aeMode가 SCP인 케이스 조회 가능", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: AeMode.SCP, userId: null });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(200);

      // then
      const expectedKeys = Object.keys(expectedStudy);
      expect(Object.keys(res.body)).toEqual(expectedKeys);
    });

    test("성공 - 본인 생성 케이스 조회 가능", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: null, userId: currentUser.id });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(200);

      // then
      const expectedKeys = Object.keys(expectedStudy);
      expect(Object.keys(res.body)).toEqual(expectedKeys);
      // ENCRYPTION:on 설정
      expect(res.body.patientId).not.toEqual(study.patientId);
      expect(res.body.patientName).not.toEqual(study.patientName);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testAdmins[0];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();
      const res = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: currentUser.employeeId,
          password: currentUser.password,
          isForced: true,
        })
        .expect(200);

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));

      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공 - 사용자가 존재하지 않는 경우 조회 가능", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: AeMode.SCU, userId: null });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(200);

      // then
      const expectedKeys = Object.keys(expectedStudy);
      expect(Object.keys(res.body)).toEqual(expectedKeys);
    });

    test("성공 - 자신이 생성하지 않은 경우 조회 가능", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: AeMode.SCU, userId: testUsers[1].id });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(200);

      // then
      const expectedKeys = Object.keys(expectedStudy);
      expect(Object.keys(res.body)).toEqual(expectedKeys);
    });

    test("성공 - aeMode가 SCP인 케이스 조회 가능", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: AeMode.SCP, userId: null });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(200);

      // then
      const expectedKeys = Object.keys(expectedStudy);
      expect(Object.keys(res.body)).toEqual(expectedKeys);
    });

    test("성공 - 본인 생성 케이스 조회 가능", async () => {
      // given
      const study = await studyRepository.findOne();
      await uploadJobRepository.update(study.uploadJobId, { aeMode: null, userId: currentUser.id });

      // when
      const res = await agent.get(`/studies/${study.id}`).expect(200);

      // then
      const expectedKeys = Object.keys(expectedStudy);
      expect(Object.keys(res.body)).toEqual(expectedKeys);
      // ENCRYPTION:on 설정
      expect(res.body.patientId).not.toEqual(study.patientId);
      expect(res.body.patientName).not.toEqual(study.patientName);
    });
  });
});
