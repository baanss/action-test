import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import * as moment from "moment";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";

import { SessionRepository } from "@src/auth/repository/session.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { OrderQuery, StudyStorageSortQuery } from "@src/common/constant/enum.constant";
import { StudyRepository } from "@src/study/repository/study.repository";
import { RusServiceCode } from "@src/common/middleware/user-auth.middleware";

let app: INestApplication;
let seederService: SeederService;

let sessionRepository: SessionRepository;
let studyRepository: StudyRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

const expectedStorageDetail = {
  hu3dUsed: expect.any(Number),
  ctUsed: expect.any(Number),
  etcUsed: expect.any(Number),
  free: expect.any(Number),
  total: expect.any(Number),
};

const expectedStorageStudy = {
  id: expect.any(Number),
  patientId: expect.any(String),
  patientName: expect.any(String),
  huId: expect.any(String),
  createdAt: expect.any(String),
  clinicalInfo: expect.any(Object), //nullable
  hu3d: expect.any(Object), // nullable
  dicom: {
    id: expect.any(Number),
    filePath: "valid",
    fileName: expect.any(String),
    fileSize: expect.any(Number),
  },
};

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  sessionRepository = app.get(SessionRepository);
  studyRepository = app.get(StudyRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /storage/dashboard", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    supertest.agent(app.getHttpServer()).get("/storage/dashboard").expect(401, done);
  });

  describe("API 접근 권한 없음 - 일반 계정", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      await sessionRepository.clear();

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

    test("FORBIDDEN_RESOURCE, API 요청 권한 없음", async () => {
      // when
      const res = await agent.get("/storage/dashboard");

      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("API 접근 권한 있음 - 대표 계정", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: currentAdmin.employeeId,
          password: currentAdmin.password,
        })
        .expect(200);

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response, 응답 구조 확인", async () => {
      // when
      const res = await agent.get("/storage/dashboard").expect(200);

      // then
      expect(res.body).toEqual(expectedStorageDetail);
    });

    test("200 response, 응답 값 확인", async () => {
      // when
      const res = await agent.get("/storage/dashboard").expect(200);

      // then
      const { hu3dUsed, ctUsed, etcUsed, free, total } = res.body;
      expect(total).toEqual(hu3dUsed + ctUsed + etcUsed + free);
    });
  });
});

describe("GET /storage/studies", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    supertest.agent(app.getHttpServer()).get("/storage/studies").expect(401, done);
  });

  test("403 response, 권한 없음 - 일반 사용자", async () => {
    await sessionRepository.clear();

    const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: currentUser.employeeId,
      password: currentUser.password,
    });

    const agent = supertest.agent(app.getHttpServer());
    agent.set("Cookie", res.get("Set-Cookie"));
    agent.set(customOriginHeaderKey, userServiceOrigin);

    supertest.agent(app.getHttpServer()).get("/storage/studies").expect(403);
  });

  describe("헤더에 유효한 인증 정보가 있음 - 대표 계정", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공 - 응답 값 검사", async () => {
      // given
      // when
      const res = await agent.get("/storage/studies").expect(200);

      // then
      res.body.count = testStudies.length;
      res.body.data.forEach((storageStudy) => {
        expect(storageStudy).toMatchObject(expectedStorageStudy);
      });
    });

    test("huId 검색 성공 - 특수문자 포함 _", async () => {
      // given
      const searchValue = { huId: "_" };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.data.every(({ huId }) => huId.includes(searchValue.huId))).toBeTruthy();
    });

    test("huId 검색 성공 - 특수문자 포함 %", async () => {
      // given
      const searchValue = { huId: "%" };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.data.every(({ huId }) => huId.includes(searchValue.huId))).toBeTruthy();
    });

    test("patientId 검색 성공", async () => {
      // given
      const searchValue = { patientId: testStudies[0].patientId };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((storageStudy) => {
        expect(storageStudy.patientId).toBe(searchValue.patientId);
      });
    });

    test("patientName 검색 성공", async () => {
      // given
      const searchValue = { patientName: testStudies[0].patientName };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((storageStudy) => {
        expect(storageStudy.patientName).toBe(searchValue.patientName);
      });
    });

    test("startDeliveryDate 검색 - endDeliveryDate 현재를 기준으로 검색한다.", async () => {
      // given
      const searchValue = { startDeliveryDate: moment().subtract(1, "year").toISOString() };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((study) => {
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeGreaterThanOrEqual(moment(searchValue.startDeliveryDate).toDate().getTime());
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeLessThanOrEqual(moment().toDate().getTime());
      });
    });

    test("endDeliveryDate 검색 - startDeliveryDate 1년 전을 기준으로 검색한다.", async () => {
      // given
      const searchValue = { endDeliveryDate: moment().subtract(1, "month").toISOString() };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((study) => {
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeGreaterThanOrEqual(
          moment(searchValue.endDeliveryDate).subtract(1, "year").toDate().getTime(),
        );
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeLessThanOrEqual(moment(searchValue.endDeliveryDate).toDate().getTime());
      });
    });

    test("startDeliveryDate 검색 - endDeliveryDate 현재를 기준으로 검색한다.", async () => {
      // given
      const searchValue = { startDeliveryDate: moment().subtract(1, "year").toISOString() };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((study) => {
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeGreaterThanOrEqual(moment(searchValue.startDeliveryDate).toDate().getTime());
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeLessThanOrEqual(moment().toDate().getTime());
      });
    });

    test("endDeliveryDate 검색 - startDeliveryDate 1년 전을 기준으로 검색한다.", async () => {
      // given
      const searchValue = { endDeliveryDate: moment().subtract(1, "month").toISOString() };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((study) => {
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeGreaterThanOrEqual(
          moment(searchValue.endDeliveryDate).subtract(1, "year").toDate().getTime(),
        );
        expect(moment(study.clinicalInfo.deliveryDate).toDate().getTime()).toBeLessThanOrEqual(moment(searchValue.endDeliveryDate).toDate().getTime());
      });
    });

    test("조회 성공 - 페이지네이션 포함(limit, page, sort, order)", async () => {
      // given
      const searchValue = { limit: 2, page: 2, sort: StudyStorageSortQuery.CREATED_AT, order: OrderQuery.ASC };

      // when
      const res = await agent.get("/storage/studies").query(searchValue).expect(200);

      // then
      const [studies, count] = await studyRepository.getManyAndCountWithFile(true, searchValue);

      expect(res.body.data.length).toBe(searchValue.limit);
      res.body.data.forEach((study, i) => {
        expect(study.id).toBe(studies[i].id);
        const serviceCode = process.env.SERVICE_CODE === RusServiceCode.STOMACH ? "stomach" : "kidney";
        expect(study.dicom.fileName).toBe(studies[i].dicom.fileName.replace(".zip", `_${serviceCode}_huCT.zip`));
      });
    });

    test("페이지네이션 성공 - limit가 -1인 경우 전체 조회", async () => {
      // given

      // when
      const query = { limit: -1 };
      const res = await agent.get("/storage/studies").query(query).expect(200);

      // then
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
