import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { SurgeonRepository } from "@src/surgeon/repository/surgeon.repository";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testSurgeons } from "@root/seeding/seeder/seed/surgeon.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

let app: INestApplication;
let seederService: SeederService;
let surgeonRepository: SurgeonRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

const expectedSurgeon = {
  id: expect.any(Number),
  name: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  surgeonRepository = app.get(SurgeonRepository);

  await seederService.empty();
  await seederService.seedEncryption();

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /surgeons", () => {
  let agent: supertest.SuperAgentTest;

  test("UNAUTHORIZED_AUTH_TOKEN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given
    // when-then
    await supertest.agent(app.getHttpServer()).get("/surgeons").expect(401);
  });

  describe("일반 계정 요청", () => {
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

    test("성공", async () => {
      //given

      // when
      const res = await agent.get("/surgeons").expect(200);

      // then
      const expectedResult = { count: expect.any(Number), data: expect.any(Array) };
      expect(res.body).toEqual(expectedResult);
    });
  });

  describe("대표 계정 요청", () => {
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

    test("성공", async () => {
      //given

      // when
      const res = await agent.get("/surgeons").expect(200);

      // then
      const expectedResult = { count: expect.any(Number), data: expect.any(Array) };
      expect(res.body).toEqual(expectedResult);
      expect(res.body.count).toBe(testSurgeons.length);
      expect(res.body.data[0]).toEqual(expectedSurgeon);
    });

    test("성공 - 페이지네이션", async () => {
      //given

      // when
      const query = { limit: 1 };
      const res = await agent.get("/surgeons").query(query).expect(200);

      // then
      expect(res.body.count).toBe(testSurgeons.length);
      expect(res.body.data.length).toBe(query.limit);
    });

    test("성공 - limit=-1를 전달하는 경우 전체 목록 조회", async () => {
      //given

      // when
      const query = { limit: -1 };
      const res = await agent.get("/surgeons").query(query).expect(200);

      // then
      expect(res.body.count).toBe(testSurgeons.length);
      expect(res.body.data.length).toBe(testSurgeons.length);
    });

    test("성공 - 기본 정렬 이름 기준(오름차순)", async () => {
      // given
      await surgeonRepository.save([{ name: "aaa" }, { name: "z" }, { name: "bbb" }]);
      // when
      const res = await agent.get("/surgeons").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);

      const resultNames = res.body.data.map((surgeon) => surgeon.name);
      const sortedSurgeon = res.body.data.sort().map((surgeon) => surgeon.name);
      expect(resultNames).toEqual(sortedSurgeon);
    });
  });
});

describe("GET /surgeons/:id", () => {
  let agent: supertest.SuperAgentTest;
  const targetSurgeon = testSurgeons[0];

  test("UNAUTHORIZED_AUTH_TOKEN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given
    // when-then
    await supertest.agent(app.getHttpServer()).get(`/surgeons/${targetSurgeon.id}`).expect(401);
  });

  describe("일반 계정 요청", () => {
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

    test("FORBIDDEN_RESOURCE, 요청 권한 없음", async () => {
      //given

      // when
      const res = await agent.get(`/surgeons/${targetSurgeon.id}`);

      // then
      expect(res.body.error).toEqual(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 요청", () => {
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

    test("NOT_FOUND_DATA, 요청 결과가 존재하지 않음", async () => {
      //given

      // when
      const invalidId = "9999";
      const res = await agent.get(`/surgeons/${invalidId}`);

      // then
      expect(res.body.error).toEqual(HutomHttpException.NOT_FOUND_DATA.error);
    });

    test("성공", async () => {
      //given

      // when
      const res = await agent.get(`/surgeons/${targetSurgeon.id}`);

      // then
      const expectedResult = {
        id: expect.any(Number),
        name: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      };
      expect(res.body).toEqual(expectedResult);
    });
  });
});
