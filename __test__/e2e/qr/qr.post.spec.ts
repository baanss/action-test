import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { AxiosResponse } from "axios";
import { of } from "rxjs";

import { HttpService } from "@nestjs/axios";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testSCUUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { AeMode } from "@src/common/constant/enum.constant";

let app: INestApplication;
let seederService: SeederService;
let uploadJobRepository: UploadJobRepository;
let httpService: HttpService;
let mockAxiosResponse: AxiosResponse;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  httpService = app.get<HttpService>(HttpService);
  seederService = app.get(SeederService);
  uploadJobRepository = app.get(UploadJobRepository);

  await app.init();

  // mock function
  mockAxiosResponse = {
    data: {
      message: "스터디 가져오기 성공",
    },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {},
  };
  jest.spyOn(httpService, "post").mockImplementation(() => of(mockAxiosResponse));
});

afterAll(async () => {
  await seederService.empty();
  await app.close();

  jest.clearAllMocks();
});

describe("POST /qr/studies", () => {
  let agent: supertest.SuperAgentTest;

  const requestBody = {
    studyInstanceUID: "new-study",
    patientId: "patient-id",
  };

  describe("일반 계정 요청", () => {
    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("EXCEEDED_QR_REQUEST_MAX_COUNT - 최대 요청 횟수 초과", async () => {
      // given
      await uploadJobRepository.save([
        {
          huId: "test_1",
          studyInstanceUID: "prev-study1",
          aeMode: AeMode.SCU,
        },
        {
          huId: "test_2",
          studyInstanceUID: "prev-study2",
          aeMode: AeMode.SCU,
        },
      ]);

      // when
      const res = await agent.post("/qr/studies").send(requestBody);

      // then
      expect(res.body.error).toBe(HutomHttpException.EXCEEDED_QR_REQUEST_MAX_COUNT.error);
    });

    test("DUPLICATED_QR_REQUEST_ON_DB - 동일한 Study의 QR 요청이 존재함", async () => {
      // given
      await uploadJobRepository.update(testSCUUploadJobs.at(-1).id, {
        studyInstanceUID: requestBody.studyInstanceUID,
      });

      // when
      const res = await agent.post("/qr/studies").send(requestBody);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_QR_REQUEST_ON_DB.error);
    });

    test("성공 - 요청 타입 검사, nullable", async () => {
      // given

      // when
      const res = await agent.post("/qr/studies").send(requestBody);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);
      const uploadJob = await uploadJobRepository.findOne(res.body.id);
      expect(uploadJob.aeMode).toBe(AeMode.SCU);
      expect(uploadJob.studyInstanceUID).toBe(requestBody.studyInstanceUID);
      expect(uploadJob.patientId).not.toBe(requestBody.patientId);
      expect(uploadJob.huId).not.toBeNull();
    });

    test("성공 - 저장 결과 검사. age", async () => {
      // given

      // when
      const body = { ...requestBody, age: "010Y" };
      const res = await agent.post("/qr/studies").send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);
      const uploadJob = await uploadJobRepository.findOne(res.body.id);
      expect(uploadJob.age).toBe(10);
    });

    test("성공 - 저장 결과 검사. age", async () => {
      // given

      // when
      const body = { ...requestBody, age: "010M" };
      const res = await agent.post("/qr/studies").send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);
      const uploadJob = await uploadJobRepository.findOne(res.body.id);
      expect(uploadJob.age).toBe(0);
    });

    test("성공 - 저장 결과 검사. sex", async () => {
      // given

      // when
      const body = { ...requestBody, sex: "invalid" };
      const res = await agent.post("/qr/studies").send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);
      const uploadJob = await uploadJobRepository.findOne(res.body.id);
      expect(uploadJob.sex).toBeNull();
    });
  });

  describe("대표 계정 요청", () => {
    const targetUser = currentAdmin;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    afterEach(async () => {
      jest.clearAllMocks();
    });

    test("성공", async () => {
      // given

      // when
      const res = await agent.post("/qr/studies").send(requestBody);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);
    });
  });
});
