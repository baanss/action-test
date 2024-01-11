import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

let app: INestApplication;
let seederService: SeederService;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /server-logs/download", () => {
  let agent: supertest.SuperAgentTest;

  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // when-then
    supertest.agent(app.getHttpServer()).get("/server-logs/download").expect(401);
  });

  describe("일반 계정 요청", () => {
    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();
      const currentUser = testUsers[0];

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, h-Space 요청이 아님", async () => {
      // given
      // when
      const res = await agent.get("/server-logs/download");

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("대표 계정 요청", () => {
    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();
      const currentAdmin = testAdmins[0];

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, h-Space 요청이 아님", async () => {
      // given
      // when
      const res = await agent.get("/server-logs/download");

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("h-Space 요청", () => {
    beforeEach(async () => {
      await seederService.empty();
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("200 repsonse, 압축된 로그 파일 다운로드", async () => {
      // given

      // when
      const res = await agent.get("/server-logs/download");

      // then
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/zip");
    });
  });
});
