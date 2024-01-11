import * as faker from "faker";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { ApplicationRepository } from "@src/application/repository/application.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { generateNestApplication, expectNullableString } from "@test/util/test.util";

let app: INestApplication;
let seederService: SeederService;

let applicationRepository: ApplicationRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentAdmin = testAdmins[0];
const currentUser = testUsers[0];
const expectedApplication = {
  id: expect.any(Number),
  employeeId: expect.any(String),
  email: expect.any(String),
  name: expect.any(String),
  // phoneNumber: string | null;
  createdAt: expect.any(String),
};

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);

  applicationRepository = app.get(ApplicationRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /applications", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/applications").expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("FORBIDDEN_RESOURCE, 접근 권한 없음", async () => {
      // given

      // when
      const res = await agent.get("/applications");

      // then
      expect(res.body.error).toEqual(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];
    const expectedBody = {
      data: expect.any(Array),
      count: expect.any(Number),
    };

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response, 가입 신청서 검색 조회 성공 - employeeId, name", async () => {
      // given
      const initData = { employeeId: faker.lorem.word(), email: faker.internet.email(), name: faker.name.findName() };
      await applicationRepository.save(initData);

      // when
      const searchQuery = { employeeId: initData.employeeId.slice(0, 1), name: initData.name.slice(0, 1) };
      const res = await agent.get("/applications").query(searchQuery);

      // then
      expect(res.body).toEqual(expectedBody);
      expect(res.body.count).toBeGreaterThan(0);
      const resData = res.body.data[0];
      const { phoneNumber, ...rest } = resData;
      const { employeeId, name } = resData;

      // 응답 구조 검증
      expect(rest).toEqual(expectedApplication);
      expectNullableString(phoneNumber);

      // 검색 결과 일치 검증
      expect(employeeId.toLowerCase()).toContain(searchQuery.employeeId.toLowerCase());
      expect(name.toLowerCase()).toContain(searchQuery.name.toLowerCase());
    });

    test("200 response, 특정 조건(limit = -1) 전체 검색 성공", async () => {
      // given
      const [, expectedCount] = await applicationRepository.findAndCount();

      // when
      const searchQuery = { limit: -1 };
      const res = await agent.get("/applications").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(expectedCount);
    });

    test("200 response, 페이지네이션 적용하여 조회 성공", async () => {
      // given
      const [, expectedCount] = await applicationRepository.findAndCount();

      // when
      const searchQuery = { page: 2, limit: 2 };
      const res = await agent.get("/applications").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(expectedCount);
      expect(res.body.data.length).toEqual(searchQuery.limit);
    });
  });
});
