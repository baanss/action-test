import * as fs from "fs";
import * as moment from "moment";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication, expectNullableObject, expectNullableString, expectNullableNumber } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";

import { UserRepository } from "@src/user/repository/user.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { RusServiceCode } from "@src/common/middleware/user-auth.middleware";

let app: INestApplication;
let seederService: SeederService;
let userRepository: UserRepository;
let rusCaseRepository: RusCaseRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

const expectedRusCase = {
  id: expect.any(Number),
  status: expect.any(String),
  huId: expect.any(String),
  patientId: expect.any(String),
  patientName: expect.any(String),
  operationType: expect.any(String),
  deliveryDate: expect.any(String),
  age: expect.any(Number),
  sex: expect.any(String),
  height: expect.any(Number),
  weight: expect.any(Number),
  childbirth: expect.any(Boolean),
  // operationDate: expect.any(String), // nullble
  // memo: expect.any(String), // nullble
  // remark: expect.any(String), // nullble
  // userName: expect.any(String), // nullable
  // hu3dURL: expect.any(String), // nullable
  // hu3dFileName: expect.any(String), //nullable
  // feedbackId: expect.any(Number), // nullable
  // surgeonName: expect.any(String), // nullable
};

const expectedRusCaseDetail = {
  id: expect.any(Number),
  status: expect.any(String),
  surgeonName: expect.any(String), // nullable
  hu3dURL: expect.any(String), // nullable
  dicomURL: expect.any(String), // nulllable
  study: {
    id: expect.any(Number),
    huId: expect.any(String),
    patientId: expect.any(String),
    patientName: expect.any(String),
    dicom: {
      id: expect.any(Number),
      filePath: expect.any(String), // nullable
      fileName: expect.any(String),
      fileSize: expect.any(Number),
    },
  },
  clinicalInfo: {
    id: expect.any(Number),
    operationType: expect.any(String),
    deliveryDate: expect.any(String),
    age: expect.any(Number),
    sex: expect.any(String),
    height: expect.any(Number),
    weight: expect.any(Number),
    childbirth: expect.any(Boolean),
    operationDate: expect.any(String), // nullble
    memo: expect.any(String), // nullble
    remark: expect.any(String), // nullble
  },
  hu3d: {
    id: expect.any(Number),
    fileName: expect.any(String),
    fileSize: expect.any(Number),
    filePath: expect.any(String), // nullable
    version: expect.any(Number),
  }, // nullable
};

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  userRepository = app.get(UserRepository);
  rusCaseRepository = app.get(RusCaseRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /rus-cases", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/rus-cases").expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공 - 본인 리소스 조회(본인이 생성한 리소스)", async () => {
      // given

      // when
      const res = await agent.get("/rus-cases").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((rusCase) => {
        const { operationDate, memo, remark, userName, hu3dURL, hu3dFileName, feedbackId, surgeonName, ...rest } = rusCase;
        expect(rest).toEqual(expectedRusCase);
        expectNullableString(operationDate);
        expectNullableString(memo);
        expectNullableString(remark);
        expectNullableString(userName);
        expectNullableString(hu3dURL);
        expectNullableString(hu3dFileName);
        expectNullableNumber(feedbackId);
        expectNullableString(surgeonName);
        expect(rusCase.userName).toBe(currentUser.name);
      });
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("startDeliveryDate 검색 - endDeliveryDate 현재를 기준으로 검색한다.", async () => {
      // given
      const query = { startDeliveryDate: moment().subtract(1, "year").toISOString() };

      // when
      const res = await agent.get("/rus-cases").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((rusCase) => {
        expect(moment(rusCase.deliveryDate).toDate().getTime()).toBeGreaterThanOrEqual(moment(query.startDeliveryDate).toDate().getTime());
        expect(moment(rusCase.deliveryDate).toDate().getTime()).toBeLessThanOrEqual(moment().toDate().getTime());
      });
    });

    test("endDeliveryDate 검색 - startDeliveryDate 1년 전을 기준으로 검색한다.", async () => {
      // given
      const query = { endDeliveryDate: moment().subtract(1, "month").toISOString() };

      // when
      const res = await agent.get("/rus-cases").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((rusCase) => {
        expect(moment(rusCase.deliveryDate).toDate().getTime()).toBeGreaterThanOrEqual(moment(query.endDeliveryDate).subtract(1, "year").toDate().getTime());
        expect(moment(rusCase.deliveryDate).toDate().getTime()).toBeLessThanOrEqual(moment(query.endDeliveryDate).toDate().getTime());
      });
    });

    test("huId 검색 성공", async () => {
      // given
      const searchValue = { huId: testStudies[0].huId };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data.every((rusCase) => rusCase.huId.includes(searchValue.huId))).toBeTruthy();
    });

    test("huId 검색 성공 - 특수문자 포함 _", async () => {
      // given
      const searchValue = { huId: "_" };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data.every((rusCase) => rusCase.huId.includes(searchValue.huId))).toBeTruthy();
    });

    test("patientId 검색 실패 - DB 암호화하는 경우, 일부 문자열 일치 검색 불가", async () => {
      // given
      const searchValue = { patientId: testStudies[0].patientId.slice(-1) };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then: 응답 구조 검사
      expect(res.body.data.length).toBe(0);
      expect(res.body.count).toBe(0);
      expect(res.body.data.some((rusCase) => rusCase.patientId.includes(searchValue.patientId))).toBeFalsy();
    });

    test("patientId 검색 성공 - DB 암호화하는 경우, 전체 문자열 일치 검색 가능 ", async () => {
      // given
      const searchValue = { patientId: testStudies[0].patientId };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then: 응답 구조 검사
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data.every((rusCase) => rusCase.patientId === searchValue.patientId)).toBeTruthy();
    });

    test("patientName 검색 실패 - DB 암호화하는 경우, 일부 문자열 일치 검색 불가", async () => {
      // given
      const searchValue = { patientName: testStudies[0].patientName.slice(-1) };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then: 응답 구조 검사
      expect(res.body.data.length).toBe(0);
      expect(res.body.count).toBe(0);
      expect(res.body.data.some((rusCase) => rusCase.patientName.includes(searchValue.patientName))).toBeFalsy();
    });

    test("patientName 검색 성공 - DB 암호화하는 경우, 전체 문자열 일치 검색 가능 ", async () => {
      // given
      const searchValue = { patientName: testStudies[0].patientName };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then: 응답 구조 검사
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data.every((rusCase) => rusCase.patientName === searchValue.patientName)).toBeTruthy();
    });

    test("patientId, patientName 검색 성공 - DB 암호화하는 경우, 전체 문자열 일치 검색 가능 ", async () => {
      // given
      const searchValue = { patientId: testStudies[0].patientId, patientName: testStudies[0].patientName };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then: 응답 구조 검사
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data.every((rusCase) => rusCase.patientId === searchValue.patientId && rusCase.patientName === searchValue.patientName)).toBeTruthy();
    });

    test("userName 검색 성공", async () => {
      // given
      const searchValue = { userName: testRusCases[0].user.name.slice(1, 3) };

      // when
      const res = await agent.get("/rus-cases").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data.every((rusCase) => rusCase.userName.includes(searchValue.userName))).toBeTruthy();
    });

    test("페이지네이션", async () => {
      // given
      const PAGE = 2;
      const LIMIT = 2;
      const paginationQuery = { page: PAGE, limit: LIMIT };

      // when
      const res = await agent.get("/rus-cases").query(paginationQuery);

      // then
      expect(res.body.count).toEqual(testRusCases.length);
      expect(res.body.data.length).toEqual(LIMIT);
    });

    test("페이지네이션 성공 - limit가 -1인 경우 전체 조회", async () => {
      // given

      // when
      const query = { limit: -1 };
      const res = await agent.get("/rus-cases").query(query).expect(200);

      // then
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    describe("성공", () => {
      beforeAll(async () => {
        await userRepository.delete({ id: currentUser.id });
      });

      afterAll(async () => {
        await seederService.empty();
        await seederService.seedEncryption();
      });

      test("전체 리소스 조회", async () => {
        // given

        // when
        const res = await agent.get("/rus-cases").expect(200);

        // then
        expect(res.body.count).toBe(testRusCases.length);
        res.body.data.forEach((rusCase) => {
          const { operationDate, memo, remark, userName, hu3dURL, hu3dFileName, feedbackId, surgeonName, ...rest } = rusCase;
          expect(rest).toEqual(expectedRusCase);
          expectNullableString(operationDate);
          expectNullableString(memo);
          expectNullableString(remark);
          expectNullableString(userName);
          expectNullableString(hu3dURL);
          expectNullableString(hu3dFileName);
          expectNullableNumber(feedbackId);
          expectNullableString(surgeonName);
        });
      });
    });
  });
});

describe("GET /rus-cases/:id", () => {
  const rusCaseId = "1";
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get(`/rus-cases/${rusCaseId}`).expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("NOT_FOUND_RUS_CASE_WITH_ID, rusCase가 존재하지 않음", async () => {
      // given
      const rusCaseId = 999;

      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}`);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.error);
    });

    test("200 response", async () => {
      // given
      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}`).expect(200);

      // then
      expect(Object.keys(res.body)).toEqual(Object.keys(expectedRusCaseDetail));
      const { id, status, surgeonName, hu3dURL, dicomURL, study, clinicalInfo, hu3d } = res.body;
      expect(id).toEqual(expect.any(Number));
      expect(status).toEqual(expect.any(String));
      expectNullableString(surgeonName);
      expectNullableString(hu3dURL);
      expectNullableString(dicomURL);
      expect(study).toEqual(expectedRusCaseDetail.study);
      expect(clinicalInfo.id).toEqual(expectedRusCaseDetail.clinicalInfo.id);
      expectNullableObject(hu3d, expectedRusCaseDetail.hu3d);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response", async () => {
      // given
      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}`).expect(200);

      // then
      expect(Object.keys(res.body)).toEqual(Object.keys(expectedRusCaseDetail));
    });
  });
});

describe("GET /rus-cases/:id/download-huct", () => {
  const targetRusCase = testRusCases[0];
  const rusCaseId = targetRusCase.id;
  const huId = targetRusCase.study.huId;

  beforeAll(async () => {
    await fs.promises.mkdir("__test__/dicom").catch(() => false);
    await fs.promises.mkdir(`__test__/dicom/${huId}`).catch(() => false);

    const rusCase = await rusCaseRepository.getOneById(rusCaseId);
    await fs.promises.writeFile(rusCase.study.dicom.filePath, "");
  });

  afterAll(async () => {
    await fs.promises.rm("__test__/dicom", { recursive: true, force: true });
  });

  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get(`/rus-cases/${rusCaseId}/download-huct`).expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("NOT_FOUND_RUS_CASE_WITH_ID, rusCase가 존재하지 않음", async () => {
      // given
      const rusCaseId = 999;

      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}/download-huct`);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.error);
    });

    test("200 response", async () => {
      // given
      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}/download-huct`).expect(200);

      // then
      const serviceCode = process.env.SERVICE_CODE === RusServiceCode.STOMACH ? "stomach" : "kidney";
      const fileName = `${huId}_${serviceCode}_huCT.zip`;
      expect(res.header["content-disposition"]).toContain(fileName);
      expect(res.header["content-disposition"]).toContain("attachment");
    });

    test("FORBIDDEN_RESOURCE, 접근 권한이 없는 케이스", async () => {
      // given
      await rusCaseRepository.update(rusCaseId, { userId: null });

      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}/download-huct`);

      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("NOT_FOUND_RUS_CASE_WITH_ID, rusCase가 존재하지 않음", async () => {
      // given
      const rusCaseId = 999;

      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}/download-huct`);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.error);
    });

    test("NOT_FOUND_DICOM_ON_DISK, 파일이 디스크 상 존재하지 않음", async () => {
      // given
      await fs.promises.rm("__test__/dicom", { recursive: true, force: true });

      // when
      const res = await agent.get(`/rus-cases/${rusCaseId}/download-huct`);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DICOM_ON_DISK.error);
    });
  });
});
